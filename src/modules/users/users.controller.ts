import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UsernameParam } from '../../types';
import { findUserByUsername, toUserResponse, updateUser } from './users.service';
import type { EditUserRoute } from './users.types';

export const currentUser = async (request: FastifyRequest, reply: FastifyReply) => {
	return reply.status(200).send(toUserResponse(request.user));
};

export const getUserByUsername = async (request: FastifyRequest<UsernameParam>, reply: FastifyReply) => {
	const user = await findUserByUsername(request.params.username);

	if (!user) {
		return reply.status(400).send({ message: 'User not found' });
	}

	return reply.status(200).send(toUserResponse(user));
};

export const editUser = async (request: FastifyRequest<EditUserRoute>, reply: FastifyReply) => {
	const user = await updateUser(request.user.id, request.body);

	if (!user) {
		return reply.status(400).send({ message: 'User not found' });
	}

	return reply.status(200).send(toUserResponse(user));
};
