import type { FastifyInstance } from 'fastify';
import { currentUser, editUser, getUserByUsername } from '../controllers/user';
import { protect } from '../hooks';
import type { EditUserRoute } from '../types';

export async function userRoutes(server: FastifyInstance) {
	server.get('/current', { preHandler: protect }, currentUser);
	server.put<EditUserRoute>('/edit', { preHandler: protect }, editUser);
	server.get('/:username', getUserByUsername);
}
