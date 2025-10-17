import { FastifyInstance } from 'fastify';
import { generateImage } from '../controllers/generate';
import { protect } from '../middleware/auth-middleware';

export async function generateRoutes(server: FastifyInstance) {
	server.post('/image', { preHandler: protect }, generateImage);
}
