import { FastifyInstance } from 'fastify';
import { loginUser, logoutAllDevices, logoutUser, refreshToken, registerUser } from '../controllers/auth';
import { protect } from '../middleware/auth-middleware';

export async function authRoutes(server: FastifyInstance) {
	server.post('/register', registerUser);
	server.post('/login', loginUser);
	server.post('/refresh', refreshToken);
	server.post('/logout', { preHandler: protect }, logoutUser);
	server.post('/logout-all', { preHandler: protect }, logoutAllDevices);
}
