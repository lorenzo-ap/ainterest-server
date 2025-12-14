import { CookieSerializeOptions } from '@fastify/cookie';
import bcrypt from 'bcryptjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { RefreshToken, User } from '../models';
import { GoogleAuthBody, LoginBody, RegisterBody } from '../types';

const ACCESS_TOKEN_EXPIRY_MINUTES = 5;
const ACCESS_TOKEN_EXPIRY_MS = ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000;
const ACCESS_TOKEN_EXPIRY_JWT = '5m';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_JWT = '7d';

const ACCESS_TOKEN_COOKIE_PATH = '/';
const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

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
	return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET!, {
		expiresIn: ACCESS_TOKEN_EXPIRY_JWT
	});
};

const generateRefreshToken = (id: string) => {
	return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
		expiresIn: REFRESH_TOKEN_EXPIRY_JWT
	});
};

const setAuthTokens = async (userId: string, reply: FastifyReply) => {
	const accessToken = generateAccessToken(userId);
	const refreshToken = generateRefreshToken(userId);

	await RefreshToken.create({
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
export const registerUser = async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
	const { username, email, password } = request.body;

	if (!username || !email || !password) {
		return reply.status(400).send({ message: 'Please enter all fields' });
	}

	const usernameExists = await User.findOne({ username });

	if (usernameExists) {
		return reply.status(400).send({ message: 'Username already taken' });
	}

	const emailExists = await User.findOne({ email });

	if (emailExists) {
		return reply.status(400).send({ message: 'Email already taken' });
	}

	// Hash password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	// Create user
	const user = await User.create({
		username,
		email,
		password: hashedPassword
	});

	if (!user) {
		return reply.status(400).send({ message: 'Invalid user data' });
	}

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
export const loginUser = async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
	const { email, password } = request.body;

	const user = await User.findOne({ email });

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
export const googleAuth = async (request: FastifyRequest<{ Body: GoogleAuthBody }>, reply: FastifyReply) => {
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

		let user = await User.findOne({ email });

		if (!user) {
			let username = name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];

			// Check if username is taken and make it unique if needed
			let usernameExists = await User.findOne({ username });
			let counter = 1;
			while (usernameExists) {
				username = `${username}${counter}`;
				usernameExists = await User.findOne({ username });
				counter++;
			}

			const salt = await bcrypt.genSalt(10);
			const randomPassword = await bcrypt.hash(Math.random().toString(36), salt);

			user = await User.create({
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
		const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as jwt.JwtPayload;

		const storedToken = await RefreshToken.findOne({
			token: refreshToken,
			userId: decoded.id
		});

		if (!storedToken) {
			return reply.status(403).send({ message: 'Invalid refresh token' });
		}

		if (storedToken.isExpired()) {
			await RefreshToken.deleteOne({ _id: storedToken._id });
			return reply.status(403).send({ message: 'Refresh token expired' });
		}

		const user = await User.findById(decoded.id);

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
		const authenticatedRequest = request as AuthenticatedRequest;
		const refreshToken = request.cookies['refresh-token'];

		if (refreshToken) {
			await RefreshToken.deleteOne({
				token: refreshToken,
				userId: authenticatedRequest.user._id
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
		const authenticatedRequest = request as AuthenticatedRequest;

		await RefreshToken.deleteMany({
			userId: authenticatedRequest.user._id
		});

		reply.clearCookie('access-token', accessTokenCookieOptions);
		reply.clearCookie('refresh-token', refreshTokenCookieOptions);

		return reply.status(200).send({ message: 'Logged out from all devices successfully' });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Server error' });
	}
};
