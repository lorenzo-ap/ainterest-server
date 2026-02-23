import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models';
import { getEnvString } from '../utils/utils';

export const protect = async (request: FastifyRequest, reply: FastifyReply) => {
	const accessToken = request.cookies['access-token'];

	if (!accessToken) {
		return reply.status(401).send({ message: 'Not authorized, no access-token provided' });
	}

	try {
		const decoded = jwt.verify(accessToken, getEnvString('JWT_ACCESS_SECRET')) as jwt.JwtPayload;
		const user = await UserModel.findById(decoded.id).select('-password');

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
