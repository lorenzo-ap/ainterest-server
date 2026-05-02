import type { FastifyReply, FastifyRequest } from 'fastify';
import type { IdParam } from '../../types';
import { createComment, deleteComment, getCommentsByPostId } from './comments.service';
import type { CreateCommentRoute } from './comments.types';

export const getComments = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const comments = await getCommentsByPostId(request.params.id);
		return reply.status(200).send(comments);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error fetching comments' });
	}
};

export const createNewComment = async (request: FastifyRequest<CreateCommentRoute>, reply: FastifyReply) => {
	try {
		const result = await createComment(request.params.id, request.user.id, request.body);
		return reply.status(result.status).send(result.body);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error creating comment' });
	}
};

export const removeComment = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const result = await deleteComment(request.params.id, request.user.id, request.user.role);
		return reply.status(result.status).send(result.body);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error deleting comment' });
	}
};
