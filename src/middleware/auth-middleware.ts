import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models';

interface JWTPayload {
	id: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
	user: Omit<IUser, 'password'>;
}

export const protect = async (request: FastifyRequest, reply: FastifyReply) => {
	const authenticatedRequest = request as AuthenticatedRequest;

	let token: string | undefined;

	if (request.headers.authorization && request.headers.authorization.startsWith('Bearer')) {
		token = request.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return reply.status(401).send({ message: 'Not authorized, no token' });
	}

	try {
		// Verify access token
		const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;

		// Get user from token without password and assign it to the request object
		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			return reply.status(401).send({ message: 'Not authorized, user not found' });
		}

		// Attach user to request
		authenticatedRequest.user = user as Omit<IUser, 'password'>;
	} catch (error: any) {
		authenticatedRequest.log.error(error);

		if (error.name === 'TokenExpiredError') {
			return reply.status(401).send({ message: 'Access token expired' });
		}

		return reply.status(401).send({ message: 'Not authorized, invalid token' });
	}
};
