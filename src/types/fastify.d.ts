import type { User } from './user';

declare module 'fastify' {
	interface FastifyRequest {
		user: Omit<User, 'password'>;
	}
}
