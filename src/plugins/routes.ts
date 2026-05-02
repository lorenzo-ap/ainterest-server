import fastifyPlugin from 'fastify-plugin';
import {
	authRoutes,
	commentRoutes,
	generateRoutes,
	notificationRoutes,
	passkeyRoutes,
	postRoutes,
	userRoutes
} from '../modules';

export const routesPlugin = fastifyPlugin((app) => {
	app.register(authRoutes, { prefix: '/api/v1/auth' });
	app.register(passkeyRoutes, { prefix: '/api/v1/auth/passkeys' });
	app.register(userRoutes, { prefix: '/api/v1/user' });
	app.register(postRoutes, { prefix: '/api/v1/post' });
	app.register(commentRoutes, { prefix: '/api/v1' });
	app.register(generateRoutes, { prefix: '/api/v1/generate' });
	app.register(notificationRoutes, { prefix: '/api/v1/notification' });
});
