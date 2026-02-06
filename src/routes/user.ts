import type { FastifyInstance } from 'fastify';
import { currentUser, editUser, getUserByUsername } from '../controllers/user';
import { protect } from '../middleware/auth-middleware';

export async function userRoutes(server: FastifyInstance) {
	server.get('/current', { preHandler: protect }, currentUser);
	server.put('/edit', { preHandler: protect }, editUser);
	server.get('/:username', getUserByUsername);
}
