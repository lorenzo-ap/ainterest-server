import { FastifyInstance } from 'fastify';
import { createPost, deletePost, getPosts, getUserPosts, likePost } from '../controllers/post';
import { protect } from '../middleware/auth-middleware';
import { PostParams } from '../types';

export async function postRoutes(server: FastifyInstance) {
	server.post('/', { preHandler: protect }, createPost);
	server.get('/', getPosts);
	server.get('/:id', getUserPosts);
	server.put('/:id', { preHandler: protect }, likePost);
	server.delete<PostParams>('/:id', { preHandler: protect }, deletePost);
}
