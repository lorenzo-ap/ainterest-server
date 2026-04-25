import type { FastifyInstance } from 'fastify';
import { optionalProtect, protect } from '../../hooks';
import { idParamSchema } from '../../schemas';
import type { IdParam } from '../../types';
import { createPost, deletePost, getPosts, getUserPosts, likePost } from './posts.controller';
import { createPostSchema } from './posts.schemas';
import type { CreatePostRoute } from './posts.types';

export async function postRoutes(server: FastifyInstance) {
	server.get('/', { preHandler: optionalProtect }, getPosts);
	server.post<CreatePostRoute>('/', { schema: createPostSchema, preHandler: protect }, createPost);

	server.get<IdParam>('/:id', { schema: idParamSchema, preHandler: optionalProtect }, getUserPosts);
	server.put<IdParam>('/:id', { schema: idParamSchema, preHandler: protect }, likePost);
	server.delete<IdParam>('/:id', { schema: idParamSchema, preHandler: protect }, deletePost);
}
