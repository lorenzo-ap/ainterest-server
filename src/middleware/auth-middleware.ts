import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models';

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
		const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as jwt.JwtPayload;
		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			return reply.status(401).send({ message: 'Not authorized, user not found' });
		}

		authenticatedRequest.user = user as Omit<IUser, 'password'>;
	} catch (error: any) {
		authenticatedRequest.log.error(error);

		if (error.name === 'TokenExpiredError') {
			return reply.status(401).send({ message: 'Access token expired' });
		}

		return reply.status(401).send({ message: 'Not authorized, invalid token' });
	}
};
