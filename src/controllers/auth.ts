import { CookieSerializeOptions } from '@fastify/cookie';
import bcrypt from 'bcryptjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { RefreshToken, User } from '../models';
import { LoginBody, RegisterBody } from '../types';

const accessTokenCookieOptions: CookieSerializeOptions = {
	httpOnly: true,
	secure: true,
	sameSite: 'none',
	maxAge: 5 * 60 * 1000, // 5 minutes,
	path: '/'
};

const refreshTokenCookieOptions: CookieSerializeOptions = {
	httpOnly: true,
	secure: true,
	sameSite: 'none',
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	path: '/api/v1/auth'
};

const generateAccessToken = (id: string) => {
	return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET!, {
		expiresIn: '5m' // 5 minutes
	});
};

const generateRefreshToken = (id: string) => {
	return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
		expiresIn: '7d' // 7 days
	});
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

	const accessToken = generateAccessToken(user._id.toString());
	const refreshToken = generateRefreshToken(user._id.toString());

	await RefreshToken.create({
		userId: user._id,
		token: refreshToken,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
	});

	reply.cookie('access-token', accessToken, accessTokenCookieOptions);
	reply.cookie('refresh-token', refreshToken, refreshTokenCookieOptions);

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

	const accessToken = generateAccessToken(user._id.toString());
	const refreshToken = generateRefreshToken(user._id.toString());

	await RefreshToken.create({
		userId: user._id,
		token: refreshToken,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
	});

	reply.cookie('access-token', accessToken, accessTokenCookieOptions);
	reply.cookie('refresh-token', refreshToken, refreshTokenCookieOptions);

	return reply.status(200).send({
		_id: user._id,
		username: user.username,
		email: user.email,
		photo: user.photo,
		role: user.role
	});
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

		// Verify user still exists
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
