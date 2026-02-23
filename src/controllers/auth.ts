import type { CookieSerializeOptions } from '@fastify/cookie';
import bcrypt from 'bcryptjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { RefreshTokenModel, UserModel } from '../models';
import { sendPasswordResetEmail } from '../services';
import type { ForgotPasswordRoute, GoogleAuthRoute, LoginRoute, RegisterRoute, ResetPasswordRoute } from '../types';
import { getEnvString } from '../utils/utils';

const ACCESS_TOKEN_EXPIRY_MINUTES = 5;
const ACCESS_TOKEN_EXPIRY_MS = ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000;
const ACCESS_TOKEN_EXPIRY_JWT = '5m';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_JWT = '7d';

const ACCESS_TOKEN_COOKIE_PATH = '/';
const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

const RESET_TOKEN_EXPIRY_HOURS = 1;
const RESET_TOKEN_EXPIRY_MS = RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
const RESET_TOKEN_EXPIRY_JWT = '1h';

const accessTokenCookieOptions: CookieSerializeOptions = {
	httpOnly: true,
	secure: true,
	sameSite: 'strict',
	maxAge: ACCESS_TOKEN_EXPIRY_MS,
	path: ACCESS_TOKEN_COOKIE_PATH
};

const refreshTokenCookieOptions: CookieSerializeOptions = {
	httpOnly: true,
	secure: true,
	sameSite: 'strict',
	maxAge: REFRESH_TOKEN_EXPIRY_MS,
	path: REFRESH_TOKEN_COOKIE_PATH
};

const generateAccessToken = (id: string) => {
	return jwt.sign({ id }, getEnvString('JWT_ACCESS_SECRET'), {
		expiresIn: ACCESS_TOKEN_EXPIRY_JWT
	});
};

const generateRefreshToken = (id: string) => {
	return jwt.sign({ id }, getEnvString('JWT_REFRESH_SECRET'), {
		expiresIn: REFRESH_TOKEN_EXPIRY_JWT
	});
};

const generateResetToken = (id: string) => {
	return jwt.sign({ id }, getEnvString('JWT_RESET_SECRET'), {
		expiresIn: RESET_TOKEN_EXPIRY_JWT
	});
};

const setAuthTokens = async (userId: string, reply: FastifyReply) => {
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

/**
	@desc Register new user
	@route POST /api/v1/auth/register
	@access Public
**/
export const registerUser = async (request: FastifyRequest<RegisterRoute>, reply: FastifyReply) => {
	const { username, email, password } = request.body;

	const usernameExists = await UserModel.findOne({ username });
	if (usernameExists) {
		return reply.status(400).send({ message: 'Username already taken' });
	}

	const emailExists = await UserModel.findOne({ email });
	if (emailExists) {
		return reply.status(400).send({ message: 'Email already taken' });
	}

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	const user = await UserModel.create({
		username,
		email,
		password: hashedPassword
	});

	await setAuthTokens(user._id.toString(), reply);

	return reply.status(201).send({
		_id: user._id,
		username: user.username,
		email: user.email,
		photo: '',
		role: user.role
	});
};

/**
	@desc Authenticate a user
	@route POST /api/v1/auth/login
	@access Public
**/
export const loginUser = async (request: FastifyRequest<LoginRoute>, reply: FastifyReply) => {
	const { email, password } = request.body;

	const user = await UserModel.findOne({ email });
	if (!user) {
		return reply.status(400).send({ message: 'Invalid email' });
	}

	const rightPassword = await bcrypt.compare(password, user.password);
	if (!rightPassword) {
		return reply.status(400).send({ message: 'Invalid password' });
	}

	await setAuthTokens(user._id.toString(), reply);

	return reply.status(200).send({
		_id: user._id,
		username: user.username,
		email: user.email,
		photo: user.photo,
		role: user.role
	});
};

/**
	@desc Authenticate a user with Google
	@route POST /api/v1/auth/google
	@access Public
**/
export const googleAuth = async (request: FastifyRequest<GoogleAuthRoute>, reply: FastifyReply) => {
	const { credential } = request.body;

	if (!credential) {
		return reply.status(400).send({ message: 'Google credential is required' });
	}

	if (!process.env.GOOGLE_CLIENT_ID) {
		request.log.error('GOOGLE_CLIENT_ID environment variable is not set');
		return reply.status(500).send({ message: 'Google authentication is not configured' });
	}

	try {
		const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

		const ticket = await client.verifyIdToken({
			idToken: credential,
			audience: process.env.GOOGLE_CLIENT_ID
		});

		const payload = ticket.getPayload();

		if (!payload || !payload.email) {
			return reply.status(400).send({ message: 'Invalid Google credential' });
		}

		const { email, name, picture } = payload;

		let user = await UserModel.findOne({ email });

		if (!user) {
			let username = name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];

			// Check if username is taken and make it unique if needed
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
				photo: picture || ''
			});
		}

		await setAuthTokens(user._id.toString(), reply);

		return reply.status(200).send({
			_id: user._id,
			username: user.username,
			email: user.email,
			photo: user.photo,
			role: user.role
		});
	} catch (error) {
		request.log.error(error);
		return reply.status(400).send({ message: 'Invalid Google credential' });
	}
};

/**
	@desc Refresh access token
	@route POST /api/v1/auth/refresh
	@access Public
**/
export const refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
	const refreshToken = request.cookies['refresh-token'];
	if (!refreshToken) {
		return reply.status(401).send({ message: 'Refresh token required' });
	}

	try {
		const decoded = jwt.verify(refreshToken, getEnvString('JWT_REFRESH_SECRET')) as jwt.JwtPayload;

		const storedToken = await RefreshTokenModel.findOne({
			token: refreshToken,
			userId: decoded.id
		});

		if (!storedToken) {
			return reply.status(403).send({ message: 'Invalid refresh token' });
		}

		if (storedToken.isExpired()) {
			await RefreshTokenModel.deleteOne({ _id: storedToken._id });
			return reply.status(403).send({ message: 'Refresh token expired' });
		}

		const user = await UserModel.findById(decoded.id);

		if (!user) {
			return reply.status(403).send({ message: 'User not found' });
		}

		const newAccessToken = generateAccessToken(user._id.toString());

		reply.setCookie('access-token', newAccessToken, accessTokenCookieOptions);

		return reply.status(200).send({ message: 'Access token refreshed' });
	} catch (error) {
		request.log.error(error);
		return reply.status(403).send({ message: 'Your session has expired, please sign in again' });
	}
};

/**
	@desc Logout user
	@route POST /api/v1/auth/logout
	@access Private
**/
export const logoutUser = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const refreshToken = request.cookies['refresh-token'];

		if (refreshToken) {
			await RefreshTokenModel.deleteOne({
				token: refreshToken,
				userId: request.user._id
			});
		}

		reply.clearCookie('access-token', accessTokenCookieOptions);
		reply.clearCookie('refresh-token', refreshTokenCookieOptions);

		return reply.status(200).send({ message: 'Logged out successfully' });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Server error' });
	}
};

/**
	@desc Logout user from all devices
	@route POST /api/v1/auth/logout-all
	@access Private
**/
export const logoutAllDevices = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		await RefreshTokenModel.deleteMany({
			userId: request.user._id
		});

		reply.clearCookie('access-token', accessTokenCookieOptions);
		reply.clearCookie('refresh-token', refreshTokenCookieOptions);

		return reply.status(200).send({ message: 'Logged out from all devices successfully' });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Server error' });
	}
};

/**
	@desc Request password reset
	@route POST /api/v1/auth/forgot-password
	@access Public
**/
export const forgotPassword = async (request: FastifyRequest<ForgotPasswordRoute>, reply: FastifyReply) => {
	const { email } = request.body;

	if (!email) {
		return reply.status(400).send({ message: 'Email is required' });
	}

	try {
		const user = await UserModel.findOne({ email });

		if (!user) {
			return reply
				.status(200)
				.send({ message: 'If an account exists with that email, a password reset link has been sent' });
		}

		const resetToken = generateResetToken(user._id.toString());

		const salt = await bcrypt.genSalt(10);
		const hashedToken = await bcrypt.hash(resetToken, salt);

		user.resetPasswordToken = hashedToken;
		user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

		await user.save();
		await sendPasswordResetEmail(email, resetToken);

		return reply.status(200).send({
			message: 'If an account exists with that email, a password reset link has been sent'
		});
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Server error' });
	}
};

/**
	@desc Reset password with token
	@route POST /api/v1/auth/reset-password
	@access Public
**/
export const resetPassword = async (request: FastifyRequest<ResetPasswordRoute>, reply: FastifyReply) => {
	const { token, password } = request.body;

	if (!token || !password) {
		return reply.status(400).send({ message: 'Token and password are required' });
	}

	try {
		const decoded = jwt.verify(token, getEnvString('JWT_RESET_SECRET')) as jwt.JwtPayload;

		const user = await UserModel.findOne({
			_id: decoded.id,
			resetPasswordExpires: { $gt: new Date() }
		});

		if (!user || !user.resetPasswordToken) {
			return reply.status(400).send({ message: 'Invalid or expired reset token' });
		}

		const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);

		if (!isValidToken) {
			return reply.status(400).send({ message: 'Invalid or expired reset token' });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save();

		await RefreshTokenModel.deleteMany({ userId: user._id });

		return reply.status(200).send({ message: 'Password reset successfully' });
	} catch (error) {
		request.log.error(error);
		return reply.status(400).send({ message: 'Invalid or expired reset token' });
	}
};
