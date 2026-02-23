import type { FastifyInstance } from 'fastify';
import { generateImage } from '../controllers/generate';
import { protect } from '../hooks';
import { generateImageSchema } from '../schemas';
import type { GenerateImageRoute } from '../types';

export async function generateRoutes(server: FastifyInstance) {
	server.post<GenerateImageRoute>('/image', { schema: generateImageSchema, preHandler: protect }, generateImage);
}
