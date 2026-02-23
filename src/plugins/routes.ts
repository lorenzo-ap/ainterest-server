import fastifyPlugin from 'fastify-plugin';
import { authRoutes, generateRoutes, notificationRoutes, postRoutes, userRoutes } from '../routes';

export const routesPlugin = fastifyPlugin((app) => {
	app.register(authRoutes, { prefix: '/api/v1/auth' });
	app.register(userRoutes, { prefix: '/api/v1/user' });
	app.register(postRoutes, { prefix: '/api/v1/post' });
	app.register(generateRoutes, { prefix: '/api/v1/generate' });
	app.register(notificationRoutes, { prefix: '/api/v1/notification' });
});
