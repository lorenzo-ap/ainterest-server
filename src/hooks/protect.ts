import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models';
import { getEnvString } from '../utils/utils';

const getUserFromAccessToken = async (accessToken: string) => {
	const jwtAccessSecret = getEnvString('JWT_ACCESS_SECRET');
	const decoded = jwt.verify(accessToken, jwtAccessSecret) as jwt.JwtPayload;

	return UserModel.findById(decoded.id).select('-password');
};

export const protect = async (request: FastifyRequest, reply: FastifyReply) => {
	const accessToken = request.cookies['access-token'];

	if (!accessToken) {
		return reply.status(401).send({ message: 'Not authorized, no access-token provided' });
	}

	try {
		const user = await getUserFromAccessToken(accessToken);

		if (!user) {
			return reply.status(401).send({ message: 'Not authorized, user not found' });
		}

		request.user = user;
	} catch (error) {
		request.log.error(error);

		if (error instanceof jwt.TokenExpiredError) {
			return reply.status(401).send({ message: 'Access token expired' });
		}

		if (error instanceof jwt.JsonWebTokenError) {
			return reply.status(401).send({ message: 'Not authorized, invalid token' });
		}

		return reply.status(401).send({ message: 'Not authorized' });
	}
};

export const optionalProtect = async (request: FastifyRequest) => {
	const accessToken = request.cookies['access-token'];

	if (!accessToken) {
		return;
	}

	try {
		const user = await getUserFromAccessToken(accessToken);

		if (user) {
			request.user = user;
		}
	} catch {
		// Continue as guest when token is invalid or expired.
	}
};
