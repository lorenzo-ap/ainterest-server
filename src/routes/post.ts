import type { FastifyInstance } from 'fastify';
import { createPost, deletePost, getPosts, getUserPosts, likePost } from '../controllers/post';
import { protect } from '../hooks';
import { createPostSchema, idParamSchema } from '../schemas';
import type { CreatePostRoute, IdParam } from '../types';

export async function postRoutes(server: FastifyInstance) {
	server.get('/', getPosts);
	server.post<CreatePostRoute>('/', { schema: createPostSchema, preHandler: protect }, createPost);

	server.get<IdParam>('/:id', { schema: idParamSchema }, getUserPosts);
	server.put<IdParam>('/:id', { schema: idParamSchema, preHandler: protect }, likePost);
	server.delete<IdParam>('/:id', { schema: idParamSchema, preHandler: protect }, deletePost);
}
