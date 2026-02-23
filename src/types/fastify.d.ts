import type { User } from '../models';

declare module 'fastify' {
	interface FastifyRequest {
		user: Omit<User, 'password'>;
	}
}
