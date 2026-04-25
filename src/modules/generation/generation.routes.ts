import type { FastifyInstance } from 'fastify';
import { protect } from '../../hooks';
import { generateImage } from './generation.controller';
import { generateImageSchema } from './generation.schemas';
import type { GenerateImageRoute } from './generation.types';

export async function generateRoutes(server: FastifyInstance) {
	server.post<GenerateImageRoute>('/image', { schema: generateImageSchema, preHandler: protect }, generateImage);
}
