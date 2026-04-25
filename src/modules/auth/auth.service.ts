import bcrypt from 'bcryptjs';
import type { FastifyReply } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { getEnvString } from '../../utils/utils';
import { UserModel } from '../users/user.model';
import type { GoogleAuthBody, LoginBody, RegisterBody } from './auth.types';
import { RefreshTokenModel } from './refresh-token.model';
import {
	accessTokenCookieOptions,
	clearAuthTokens,
	generateAccessToken,
	generateRefreshToken,
	REFRESH_TOKEN_EXPIRY_MS,
	refreshTokenCookieOptions,
	setAuthTokens
} from './token.service';

export const toAuthUserResponse = (user: {
	id: string;
	username: string;
	email: string;
	photo?: string;
	role: string;
}) => ({
	id: user.id,
	username: user.username,
	email: user.email,
	photo: user.photo || null,
	role: user.role
});

export const register = async (body: RegisterBody, reply: FastifyReply) => {
	const { username, email, password } = body;

	const usernameExists = await UserModel.findOne({ username });
	if (usernameExists) {
		return { status: 400, body: { message: 'Username already taken' } };
	}

	const emailExists = await UserModel.findOne({ email });
	if (emailExists) {
		return { status: 400, body: { message: 'Email already taken' } };
	}

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	const user = await UserModel.create({ username, email, password: hashedPassword });
	await setAuthTokens(user.id, reply);

	return { status: 201, body: toAuthUserResponse(user) };
};

export const login = async (body: LoginBody, reply: FastifyReply) => {
	const { email, password } = body;
	const user = await UserModel.findOne({ email });

	if (!user) {
		return { status: 400, body: { message: 'Invalid credentials' } };
	}

	const rightPassword = await bcrypt.compare(password, user.password);
	if (!rightPassword) {
		return { status: 400, body: { message: 'Invalid credentials' } };
	}

	await setAuthTokens(user.id, reply);

	return { status: 200, body: toAuthUserResponse(user) };
};

export const authenticateWithGoogle = async (body: GoogleAuthBody, reply: FastifyReply) => {
	const { credential } = body;
	const googleClientId = getEnvString('GOOGLE_CLIENT_ID');
	const client = new OAuth2Client(googleClientId);

	const ticket = await client.verifyIdToken({
		idToken: credential,
		audience: googleClientId
	});

	const payload = ticket.getPayload();

	if (!payload || !payload.email) {
		return { status: 400, body: { message: 'Invalid Google credential' } };
	}

	const { email, name, picture } = payload;
	let user = await UserModel.findOne({ email });

	if (!user) {
		let username = name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
		let usernameExists = await UserModel.findOne({ username });
		let counter = 1;

		while (usernameExists) {
			username = `${username}${counter}`;
			usernameExists = await UserModel.findOne({ username });
			counter++;
		}

		const salt = await bcrypt.genSalt(10);
		const randomPassword = await bcrypt.hash(Math.random().toString(36), salt);

		user = await UserModel.create({
			username,
			email,
			password: randomPassword,
			photo: picture
		});
	}

	await setAuthTokens(user.id, reply);

	return { status: 200, body: toAuthUserResponse(user) };
};

export const rotateRefreshToken = async (incomingRefreshToken: string | undefined, reply: FastifyReply) => {
	if (!incomingRefreshToken) {
		return { status: 401, body: { message: 'Refresh token required' } };
	}

	const jwtRefreshSecret = getEnvString('JWT_REFRESH_SECRET');
	const decoded = jwt.verify(incomingRefreshToken, jwtRefreshSecret) as jwt.JwtPayload;

	const storedToken = await RefreshTokenModel.findOne({
		token: incomingRefreshToken,
		userId: decoded.id
	});

	if (!storedToken) {
		return { status: 403, body: { message: 'Invalid refresh token' } };
	}

	if (storedToken.isExpired()) {
		await RefreshTokenModel.deleteOne({ _id: storedToken.id });
		return { status: 403, body: { message: 'Refresh token expired' } };
	}

	const user = await UserModel.findById(decoded.id);

	if (!user) {
		return { status: 403, body: { message: 'User not found' } };
	}

	const newAccessToken = generateAccessToken(user.id);
	const newRefreshToken = generateRefreshToken(user.id);

	storedToken.token = newRefreshToken;
	storedToken.expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
	await storedToken.save();

	reply.setCookie('access-token', newAccessToken, accessTokenCookieOptions);
	reply.setCookie('refresh-token', newRefreshToken, refreshTokenCookieOptions);

	return { status: 200, body: { message: 'Access token refreshed' } };
};

export const logout = async (userId: string, refreshToken: string | undefined, reply: FastifyReply) => {
	if (refreshToken) {
		await RefreshTokenModel.deleteOne({ token: refreshToken, userId });
	}

	clearAuthTokens(reply);

	return { message: 'Logged out successfully' };
};

export const logoutAll = async (userId: string, reply: FastifyReply) => {
	await RefreshTokenModel.deleteMany({ userId });
	clearAuthTokens(reply);

	return { message: 'Logged out from all devices successfully' };
};
