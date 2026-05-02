import type { FastifyInstance } from 'fastify';
import { protect } from '../../hooks';
import { idParamSchema } from '../../schemas';
import type { IdParam } from '../../types';
import { createCommentSchema } from './comment.schema';
import { createNewComment, getComments, removeComment } from './comments.controller';
import type { CreateCommentRoute } from './comments.types';

export async function commentRoutes(server: FastifyInstance) {
	server.get<IdParam>('/post/:id/comments', { schema: idParamSchema }, getComments);

	server.post<CreateCommentRoute>(
		'/post/:id/comments',
		{
			schema: {
				params: idParamSchema.params,
				body: createCommentSchema.body
			},
			preHandler: protect
		},
		createNewComment
	);

	server.delete<IdParam>('/comment/:id', { schema: idParamSchema, preHandler: protect }, removeComment);
}
