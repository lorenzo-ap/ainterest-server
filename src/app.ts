import cookie from '@fastify/cookie';
import fastify from 'fastify';
import { cloudinaryPlugin, corsPlugin, dbPlugin, routesPlugin } from './plugins';

export const buildApp = async () => {
	const app = fastify({
		logger: true,
		bodyLimit: 1024 * 1024 * 50 // 50MB
	});

	await app.register(dbPlugin);
	await app.register(cookie);
	await app.register(corsPlugin);
	await app.register(cloudinaryPlugin);
	await app.register(routesPlugin);

	app.get('/', async () => {
		return { status: 'ok', message: 'Hello server!' };
	});

	return app;
};
