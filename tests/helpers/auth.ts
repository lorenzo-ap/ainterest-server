import type { FastifyInstance } from 'fastify';
import { extractCookies } from './app';

export const TEST_PASSWORD = 'TestPass1!';

export interface RegisterData {
	username?: string;
	email?: string;
	password?: string;
}

export async function registerUser(app: FastifyInstance, data: RegisterData = {}) {
	return app.inject({
		method: 'POST',
		url: '/api/v1/auth/register',
		payload: {
			username: data.username ?? 'testuser',
			email: data.email ?? 'testuser@example.com',
			password: data.password ?? TEST_PASSWORD
		}
	});
}

export async function loginUser(app: FastifyInstance, email = 'testuser@example.com', password = TEST_PASSWORD) {
	return app.inject({
		method: 'POST',
		url: '/api/v1/auth/login',
		payload: { email, password }
	});
}

export async function registerAndGetCookies(
	app: FastifyInstance,
	data: RegisterData = {}
): Promise<{ id: string; cookies: string }> {
	const response = await registerUser(app, data);
	const body = response.json<{ id: string }>();
	return { id: body.id, cookies: extractCookies(response) };
}
