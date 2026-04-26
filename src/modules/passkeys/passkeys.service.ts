import type {
	AuthenticationResponseJSON,
	AuthenticatorTransportFuture,
	RegistrationResponseJSON
} from '@simplewebauthn/server';
import {
	generateAuthenticationOptions,
	generateRegistrationOptions,
	verifyAuthenticationResponse,
	verifyRegistrationResponse
} from '@simplewebauthn/server';
import bcrypt from 'bcryptjs';
import type { FastifyReply } from 'fastify';
import { getEnvString } from '../../utils/utils';
import { toAuthUserResponse } from '../auth/auth.service';
import { setAuthTokens } from '../auth/token.service';
import { UserModel } from '../users/user.model';
import { PasskeyChallengeModel } from './passkey-challenge.model';
import { PasskeyCredentialModel } from './passkey-credential.model';

const PASSKEY_CHALLENGE_EXPIRY_MS = 5 * 60 * 1000;

const getRpId = () => {
	const frontendUrl = getEnvString('FRONTEND_URL');
	return new URL(frontendUrl).hostname;
};

const getRpOrigin = () => {
	return getEnvString('FRONTEND_URL');
};

export const createRegistrationOptions = async (userId: string, password: string) => {
	const user = await UserModel.findById(userId);
	if (!user) {
		return { status: 404, body: { message: 'User not found' } };
	}

	const passwordMatches = await bcrypt.compare(password, user.password);
	if (!passwordMatches) {
		return { status: 400, body: { message: 'Invalid credentials' } };
	}

	const rpId = getRpId();
	const rpName = getEnvString('PASSKEY_RP_NAME');

	const existingCredentials = await PasskeyCredentialModel.find({ userId: user.id });

	const options = await generateRegistrationOptions({
		rpName,
		rpID: rpId,
		userName: user.email,
		userDisplayName: user.username,
		attestationType: 'none',
		authenticatorSelection: {
			residentKey: 'preferred',
			userVerification: 'preferred'
		},
		excludeCredentials: existingCredentials.map((credential) => ({
			id: credential.credentialId,
			transports: credential.transports as AuthenticatorTransportFuture[]
		}))
	});

	await PasskeyChallengeModel.create({
		challenge: options.challenge,
		type: 'registration',
		userId: user.id,
		email: user.email,
		expiresAt: new Date(Date.now() + PASSKEY_CHALLENGE_EXPIRY_MS)
	});

	return { status: 200, body: options };
};

export const verifyRegistration = async (
	userId: string,
	name: string,
	registrationCredential: RegistrationResponseJSON
) => {
	const user = await UserModel.findById(userId);
	if (!user) {
		return { status: 404, body: { message: 'User not found' } };
	}

	const challenge = await PasskeyChallengeModel.findOne({
		userId: user.id,
		type: 'registration',
		expiresAt: { $gt: new Date() }
	}).sort({ createdAt: -1 });

	if (!challenge) {
		return { status: 400, body: { message: 'Registration challenge expired' } };
	}

	const rpId = getRpId();
	const origin = getRpOrigin();

	let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>> | undefined;
	try {
		verification = await verifyRegistrationResponse({
			response: registrationCredential,
			expectedChallenge: challenge.challenge,
			expectedOrigin: origin,
			expectedRPID: rpId
		});
	} catch (_error) {
		return { status: 400, body: { message: 'Passkey registration failed' } };
	}

	if (!verification.verified || !verification.registrationInfo) {
		return { status: 400, body: { message: 'Passkey registration failed' } };
	}

	const { credential, credentialBackedUp } = verification.registrationInfo;
	const credentialId = credential.id;
	const existing = await PasskeyCredentialModel.findOne({ credentialId });
	if (existing) {
		return { status: 409, body: { message: 'Passkey already registered' } };
	}

	const passkey = await PasskeyCredentialModel.create({
		userId: user.id,
		name,
		credentialId,
		publicKey: Buffer.from(credential.publicKey).toString('base64url'),
		counter: credential.counter,
		transports: [],
		backedUp: credentialBackedUp,
		lastUsedAt: new Date()
	});

	await PasskeyChallengeModel.deleteMany({ userId: user.id, type: 'registration' });

	return {
		status: 201,
		body: {
			...toAuthUserResponse(user),
			passkey: {
				credentialId: passkey.credentialId,
				name: passkey.name,
				createdAt: passkey.createdAt,
				lastUsedAt: passkey.lastUsedAt || null,
				transports: passkey.transports,
				backedUp: passkey.backedUp
			}
		}
	};
};

export const createAuthenticationOptions = async (email: string) => {
	const user = await UserModel.findOne({ email });
	if (!user) {
		return { status: 200, body: { message: 'If an account exists, passkey options are available' } };
	}

	const credentials = await PasskeyCredentialModel.find({ userId: user.id });
	if (!credentials.length) {
		return { status: 400, body: { message: 'No passkeys registered for this account' } };
	}

	const rpId = getRpId();
	const options = await generateAuthenticationOptions({
		rpID: rpId,
		userVerification: 'preferred',
		allowCredentials: credentials.map((credential) => ({
			id: credential.credentialId,
			transports: credential.transports as AuthenticatorTransportFuture[]
		}))
	});

	await PasskeyChallengeModel.create({
		challenge: options.challenge,
		type: 'authentication',
		userId: user.id,
		email: user.email,
		expiresAt: new Date(Date.now() + PASSKEY_CHALLENGE_EXPIRY_MS)
	});

	return { status: 200, body: options };
};

export const verifyAuthentication = async (
	email: string,
	credential: AuthenticationResponseJSON,
	reply: FastifyReply
) => {
	const user = await UserModel.findOne({ email });
	if (!user) {
		return { status: 400, body: { message: 'Invalid credentials' } };
	}

	const credentialId = credential.id;
	const storedCredential = await PasskeyCredentialModel.findOne({ userId: user.id, credentialId });
	if (!storedCredential) {
		return { status: 400, body: { message: 'Invalid credentials' } };
	}

	const challenge = await PasskeyChallengeModel.findOne({
		userId: user.id,
		type: 'authentication',
		expiresAt: { $gt: new Date() }
	}).sort({ createdAt: -1 });

	if (!challenge) {
		return { status: 400, body: { message: 'Authentication challenge expired' } };
	}

	const rpId = getRpId();
	const origin = getRpOrigin();

	let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>> | undefined;
	try {
		verification = await verifyAuthenticationResponse({
			response: credential,
			expectedChallenge: challenge.challenge,
			expectedOrigin: origin,
			expectedRPID: rpId,
			credential: {
				id: storedCredential.credentialId,
				publicKey: Buffer.from(storedCredential.publicKey, 'base64url'),
				counter: storedCredential.counter
			}
		});
	} catch (_error) {
		return { status: 400, body: { message: 'Passkey authentication failed' } };
	}

	if (!verification.verified) {
		return { status: 400, body: { message: 'Passkey authentication failed' } };
	}

	if (verification.authenticationInfo.newCounter < storedCredential.counter) {
		return { status: 403, body: { message: 'Passkey counter rollback detected' } };
	}

	storedCredential.counter = verification.authenticationInfo.newCounter;
	storedCredential.lastUsedAt = new Date();
	await storedCredential.save();

	await PasskeyChallengeModel.deleteMany({ userId: user.id, type: 'authentication' });

	await setAuthTokens(user.id, reply);

	return {
		status: 200,
		body: {
			...toAuthUserResponse(user),
			passkey: {
				credentialId: storedCredential.credentialId,
				name: storedCredential.name,
				createdAt: storedCredential.createdAt,
				lastUsedAt: storedCredential.lastUsedAt || null,
				transports: storedCredential.transports,
				backedUp: storedCredential.backedUp
			}
		}
	};
};

export const listPasskeys = async (userId: string) => {
	const credentials = await PasskeyCredentialModel.find({ userId }).sort({ createdAt: -1 });

	return credentials.map((credential) => ({
		credentialId: credential.credentialId,
		name: credential.name,
		createdAt: credential.createdAt,
		lastUsedAt: credential.lastUsedAt || null,
		transports: credential.transports,
		backedUp: credential.backedUp
	}));
};

export const revokePasskey = async (userId: string, credentialId: string) => {
	const result = await PasskeyCredentialModel.deleteOne({ userId, credentialId });

	if (!result.deletedCount) {
		return { status: 404, body: { message: 'Passkey not found' } };
	}

	return { status: 200, body: { message: 'Passkey revoked' } };
};
