import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getEnvString } from '../../utils/utils';
import { RefreshTokenModel } from './refresh-token.model';

const ACCESS_TOKEN_EXPIRY_MINUTES = 5;
const ACCESS_TOKEN_EXPIRY_MS = ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000;
const ACCESS_TOKEN_EXPIRY_JWT = '5m';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_JWT = '7d';

const RESET_TOKEN_EXPIRY_HOURS = 1;
export const RESET_TOKEN_EXPIRY_MS = RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
const RESET_TOKEN_EXPIRY_JWT = '1h';

const ACCESS_TOKEN_COOKIE_PATH = '/';
const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

export const accessTokenCookieOptions: CookieSerializeOptions = {
	httpOnly: true,
	secure: true,
	sameSite: 'strict',
	maxAge: ACCESS_TOKEN_EXPIRY_MS,
	path: ACCESS_TOKEN_COOKIE_PATH
};

export const refreshTokenCookieOptions: CookieSerializeOptions = {
	httpOnly: true,
	secure: true,
	sameSite: 'strict',
	maxAge: REFRESH_TOKEN_EXPIRY_MS,
	path: REFRESH_TOKEN_COOKIE_PATH
};

export const generateAccessToken = (id: string) => {
	const jwtAccessSecret = getEnvString('JWT_ACCESS_SECRET');
	return jwt.sign({ id }, jwtAccessSecret, {
		expiresIn: ACCESS_TOKEN_EXPIRY_JWT
	});
};

export const generateRefreshToken = (id: string) => {
	const jwtRefreshSecret = getEnvString('JWT_REFRESH_SECRET');
	return jwt.sign({ id }, jwtRefreshSecret, {
		expiresIn: REFRESH_TOKEN_EXPIRY_JWT
	});
};

export const generateResetToken = (id: string) => {
	const jwtResetSecret = getEnvString('JWT_RESET_SECRET');
	return jwt.sign({ id }, jwtResetSecret, {
		expiresIn: RESET_TOKEN_EXPIRY_JWT
	});
};

export const setAuthTokens = async (userId: string, reply: FastifyReply) => {
	const accessToken = generateAccessToken(userId);
	const refreshToken = generateRefreshToken(userId);

	await RefreshTokenModel.create({
		userId,
		token: refreshToken,
		expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
	});

	reply.cookie('access-token', accessToken, accessTokenCookieOptions);
	reply.cookie('refresh-token', refreshToken, refreshTokenCookieOptions);
};

export const clearAuthTokens = (reply: FastifyReply) => {
	reply.clearCookie('access-token', accessTokenCookieOptions);
	reply.clearCookie('refresh-token', refreshTokenCookieOptions);
};
