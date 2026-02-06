import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { type IUser, User } from '../models';
import { getEnvString } from '../utils/utils';

export interface AuthenticatedRequest extends FastifyRequest {
	user: Omit<IUser, 'password'>;
}

export const protect = async (request: FastifyRequest, reply: FastifyReply) => {
	const authenticatedRequest = request as AuthenticatedRequest;
	const accessToken = request.cookies['access-token'];

	if (!accessToken) {
		return reply.status(401).send({ message: 'Not authorized, no access-token provided' });
	}

	try {
		const decoded = jwt.verify(accessToken, getEnvString('JWT_ACCESS_SECRET')) as jwt.JwtPayload;
		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			return reply.status(401).send({ message: 'Not authorized, user not found' });
		}

		authenticatedRequest.user = user as Omit<IUser, 'password'>;
	} catch (error: unknown) {
		authenticatedRequest.log.error(error);

		if (error instanceof jwt.TokenExpiredError) {
			return reply.status(401).send({ message: 'Access token expired' });
		}

		if (error instanceof jwt.JsonWebTokenError) {
			return reply.status(401).send({ message: 'Not authorized, invalid token' });
		}

		return reply.status(401).send({ message: 'Not authorized' });
	}
};
