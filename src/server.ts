import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { v2 as cloudinary } from 'cloudinary';
import fastify, { FastifyInstance } from 'fastify';
import { connectDB } from './middleware';
import { authRoutes, generateRoutes, postRoutes, userRoutes } from './routes';

const server: FastifyInstance = fastify({
	logger: true,
	bodyLimit: 1024 * 1024 * 50 // 50MB
});

server.register(cors, {
	origin: process.env.FRONTEND_URL,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

server.register(cookie);

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

server.register(authRoutes, { prefix: '/api/v1/auth' });
server.register(userRoutes, { prefix: '/api/v1/user' });
server.register(postRoutes, { prefix: '/api/v1/posts' });
server.register(generateRoutes, { prefix: '/api/v1/generate' });

server.get('/', async (request, reply) => {
	return { status: 'ok', message: 'Hello server!' };
});

const start = async () => {
	try {
		const mongodbURL = process.env.MONGODB_URL;
		if (!mongodbURL) {
			throw new Error('MONGODB_URL is not defined in environment variables');
		}
		await connectDB(mongodbURL);

		const port = 9999;
		await server.listen({ port });
		server.log.info(`Server listening on port ${port}`);
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

start();
