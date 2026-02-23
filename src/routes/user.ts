import type { FastifyInstance } from 'fastify';
import { currentUser, editUser, getUserByUsername } from '../controllers/user';
import { protect } from '../hooks';
import { editUserSchema, usernameParamSchema } from '../schemas';
import type { EditUserRoute } from '../types';

export async function userRoutes(server: FastifyInstance) {
	server.get('/current', { preHandler: protect }, currentUser);
	server.put<EditUserRoute>('/edit', { schema: editUserSchema, preHandler: protect }, editUser);
	server.get('/:username', { schema: usernameParamSchema }, getUserByUsername);
}
