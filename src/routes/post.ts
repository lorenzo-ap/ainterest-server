import type { FastifyInstance } from 'fastify';
import { createPost, deletePost, getPosts, getUserPosts, likePost } from '../controllers/post';
import { protect } from '../hooks';
import type { CreatePostRoute, IdParam } from '../types';

export async function postRoutes(server: FastifyInstance) {
	server.get('/', getPosts);
	server.post<CreatePostRoute>('/', { preHandler: protect }, createPost);

	server.get<IdParam>('/:id', getUserPosts);
	server.put<IdParam>('/:id', { preHandler: protect }, likePost);
	server.delete<IdParam>('/:id', { preHandler: protect }, deletePost);
}
