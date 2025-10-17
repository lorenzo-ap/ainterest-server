import bcrypt from 'bcryptjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { User } from '../models';

const cookieOptions = {
	httpOnly: true,
	secure: true,
	sameSite: 'none' as const,
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	path: '/api/v1/auth/refresh'
};

interface RegisterBody {
	username: string;
	email: string;
	password: string;
}

interface LoginBody {
	email: string;
	password: string;
}

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

	user.refreshToken = refreshToken;
	await user.save();

	reply.cookie('refreshToken', refreshToken, cookieOptions);

	return reply.status(201).send({
		_id: user._id,
		username: user.username,
		email: user.email,
		photo: '',
		role: user.role,
		accessToken
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

	user.refreshToken = refreshToken;
	await user.save();

	reply.cookie('refreshToken', refreshToken, cookieOptions);

	return reply.status(200).send({
		_id: user._id,
		username: user.username,
		email: user.email,
		photo: user.photo,
		role: user.role,
		accessToken
	});
};

/**
	@desc Refresh access token
	@route POST /api/v1/auth/refresh
	@access Public
**/
export const refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
	const refreshToken = request.cookies.refreshToken;

	if (!refreshToken) {
		return reply.status(401).send({ message: 'Refresh token required' });
	}

	try {
		// Verify refresh token
		const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
			id: string;
		};

		// Find user and check if refresh token matches
		const user = await User.findById(decoded.id);

		if (!user || user.refreshToken !== refreshToken) {
			return reply.status(403).send({ message: 'Invalid refresh token' });
		}

		const newAccessToken = generateAccessToken(user._id.toString());

		return reply.status(200).send({
			accessToken: newAccessToken
		});
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
		// Remove refresh token from database
		await User.findByIdAndUpdate(authenticatedRequest.user._id, { refreshToken: null });

		// Clear refresh token cookie
		reply.clearCookie('refreshToken', {
			path: '/api/v1/auth/refresh'
		});

		return reply.status(200).send({ message: 'Logged out successfully' });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Server error' });
	}
};
