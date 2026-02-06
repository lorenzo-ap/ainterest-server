import type { FastifyInstance } from 'fastify';
import {
	forgotPassword,
	googleAuth,
	loginUser,
	logoutAllDevices,
	logoutUser,
	refreshToken,
	registerUser,
	resetPassword
} from '../controllers/auth';
import { protect } from '../middleware/auth-middleware';

export async function authRoutes(server: FastifyInstance) {
	server.post('/register', registerUser);
	server.post('/login', loginUser);
	server.post('/google', googleAuth);
	server.post('/refresh', refreshToken);
	server.post('/logout', { preHandler: protect }, logoutUser);
	server.post('/logout-all', { preHandler: protect }, logoutAllDevices);
	server.post('/forgot-password', forgotPassword);
	server.post('/reset-password', resetPassword);
}
