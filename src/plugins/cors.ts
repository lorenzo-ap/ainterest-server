import cors from '@fastify/cors';
import fastifyPlugin from 'fastify-plugin';

export const corsPlugin = fastifyPlugin((app) => {
	app.register(cors, {
		origin: process.env.FRONTEND_URL,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
	});
});
