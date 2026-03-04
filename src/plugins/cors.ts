import cors from '@fastify/cors';
import fastifyPlugin from 'fastify-plugin';
import { getEnvString } from '../utils/utils';

export const corsPlugin = fastifyPlugin((app) => {
	const frontendUrl = getEnvString('FRONTEND_URL');

	app.register(cors, {
		origin: frontendUrl,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
	});
});
