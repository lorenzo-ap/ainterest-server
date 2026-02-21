import fastifyPlugin from 'fastify-plugin';
import { authRoutes, generateRoutes, notificationRoutes, postRoutes, userRoutes } from '../routes';

export const routesPlugin = fastifyPlugin(async (app) => {
	await app.register(authRoutes, { prefix: '/api/v1/auth' });
	await app.register(userRoutes, { prefix: '/api/v1/user' });
	await app.register(postRoutes, { prefix: '/api/v1/post' });
	await app.register(generateRoutes, { prefix: '/api/v1/generate' });
	await app.register(notificationRoutes, { prefix: '/api/v1/notification' });
});
