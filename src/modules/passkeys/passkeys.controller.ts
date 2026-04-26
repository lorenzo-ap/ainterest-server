import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
	createAuthenticationOptions,
	createRegistrationOptions,
	listPasskeys,
	revokePasskey,
	verifyAuthentication,
	verifyRegistration
} from './passkeys.service';
import type {
	PasskeyAuthenticationOptionsRoute,
	PasskeyAuthenticationVerifyRoute,
	PasskeyRegistrationOptionsRoute,
	PasskeyRegistrationVerifyRoute,
	PasskeyRevokeRoute
} from './passkeys.types';

export const getRegistrationOptions = async (
	request: FastifyRequest<PasskeyRegistrationOptionsRoute>,
	reply: FastifyReply
) => {
	const result = await createRegistrationOptions(request.user.id, request.body.password);
	return reply.status(result.status).send(result.body);
};

export const verifyRegistrationResponse = async (
	request: FastifyRequest<PasskeyRegistrationVerifyRoute>,
	reply: FastifyReply
) => {
	const result = await verifyRegistration(
		request.user.id,
		request.body.name,
		request.body.credential as unknown as RegistrationResponseJSON
	);
	return reply.status(result.status).send(result.body);
};

export const getAuthenticationOptions = async (
	request: FastifyRequest<PasskeyAuthenticationOptionsRoute>,
	reply: FastifyReply
) => {
	const result = await createAuthenticationOptions(request.body.email);
	return reply.status(result.status).send(result.body);
};

export const verifyAuthenticationResponse = async (
	request: FastifyRequest<PasskeyAuthenticationVerifyRoute>,
	reply: FastifyReply
) => {
	const result = await verifyAuthentication(
		request.body.email,
		request.body.credential as unknown as AuthenticationResponseJSON,
		reply
	);
	return reply.status(result.status).send(result.body);
};

export const getPasskeys = async (request: FastifyRequest, reply: FastifyReply) => {
	const result = await listPasskeys(request.user.id);
	return reply.status(200).send(result);
};

export const removePasskey = async (request: FastifyRequest<PasskeyRevokeRoute>, reply: FastifyReply) => {
	const result = await revokePasskey(request.user.id, request.params.credentialId);
	return reply.status(result.status).send(result.body);
};
