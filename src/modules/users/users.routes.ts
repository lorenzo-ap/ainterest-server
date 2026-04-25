import type { FastifyInstance } from 'fastify';
import { protect } from '../../hooks';
import { usernameParamSchema } from '../../schemas';
import { currentUser, editUser, getUserByUsername } from './users.controller';
import { editUserSchema } from './users.schemas';
import type { EditUserRoute } from './users.types';

export async function userRoutes(server: FastifyInstance) {
	server.get('/current', { preHandler: protect }, currentUser);
	server.put<EditUserRoute>('/edit', { schema: editUserSchema, preHandler: protect }, editUser);
	server.get('/:username', { schema: usernameParamSchema }, getUserByUsername);
}
