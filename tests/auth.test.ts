import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTestApp, clearDatabase } from './helpers/app';
import { registerAndGetCookies, registerUser, TEST_PASSWORD } from './helpers/auth';

vi.mock('../src/services/email', () => ({
	sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined)
}));

describe('Auth Routes', () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app = await buildTestApp();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	describe('POST /api/v1/auth/register', () => {
		it('should register a new user and return 201', async () => {
			const response = await registerUser(app);

			expect(response.statusCode).toBe(201);
			const body = response.json<{ username: string; email: string; role: string; password?: string }>();
			expect(body.username).toBe('testuser');
			expect(body.email).toBe('testuser@example.com');
			expect(body.role).toBe('user');
			expect(body.password).toBeUndefined();
			expect(response.headers['set-cookie']).toBeDefined();
		});

		it('should return 400 when username is already taken', async () => {
			await registerUser(app, { username: 'testuser', email: 'first@example.com' });

			const response = await registerUser(app, { username: 'testuser', email: 'second@example.com' });

			expect(response.statusCode).toBe(400);
			expect(response.json<{ message: string }>().message).toBe('Username already taken');
		});

		it('should return 400 when email is already taken', async () => {
			await registerUser(app, { username: 'user1', email: 'taken@example.com' });

			const response = await registerUser(app, { username: 'user2', email: 'taken@example.com' });

			expect(response.statusCode).toBe(400);
			expect(response.json<{ message: string }>().message).toBe('Email already taken');
		});

		it('should return 400 for missing required fields', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/register',
				payload: { username: 'testuser' }
			});

			expect(response.statusCode).toBe(400);
		});

		it('should return 400 for a weak password missing special character', async () => {
			const response = await registerUser(app, { password: 'WeakPassword1' });

			expect(response.statusCode).toBe(400);
		});

		it('should return 400 for a username that is too short', async () => {
			const response = await registerUser(app, { username: 'ab' });

			expect(response.statusCode).toBe(400);
		});
	});

	describe('POST /api/v1/auth/login', () => {
		beforeEach(async () => {
			await registerUser(app);
		});

		it('should login and return 200 with auth cookies', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/login',
				payload: { email: 'testuser@example.com', password: TEST_PASSWORD }
			});

			expect(response.statusCode).toBe(200);
			const body = response.json<{ username: string; email: string }>();
			expect(body.username).toBe('testuser');
			expect(body.email).toBe('testuser@example.com');
			expect(response.headers['set-cookie']).toBeDefined();
		});

		it('should return 400 for a non-existent email', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/login',
				payload: { email: 'nobody@example.com', password: TEST_PASSWORD }
			});

			expect(response.statusCode).toBe(400);
			expect(response.json<{ message: string }>().message).toBe('Invalid email');
		});

		it('should return 400 for a wrong password', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/login',
				payload: { email: 'testuser@example.com', password: 'WrongPass1!' }
			});

			expect(response.statusCode).toBe(400);
			expect(response.json<{ message: string }>().message).toBe('Invalid password');
		});
	});

	describe('POST /api/v1/auth/refresh', () => {
		it('should return 401 when no refresh token is provided', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/refresh'
			});

			expect(response.statusCode).toBe(401);
			expect(response.json<{ message: string }>().message).toBe('Refresh token required');
		});

		it('should return a new access token with a valid refresh token', async () => {
			const { cookies } = await registerAndGetCookies(app);

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/refresh',
				headers: { cookie: cookies }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json<{ message: string }>().message).toBe('Access token refreshed');
			expect(response.headers['set-cookie']).toBeDefined();
		});

		it('should return 403 for an invalid refresh token', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/refresh',
				headers: { cookie: 'refresh-token=invalidtoken' }
			});

			expect(response.statusCode).toBe(403);
		});
	});

	describe('POST /api/v1/auth/logout', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/logout'
			});

			expect(response.statusCode).toBe(401);
		});

		it('should logout successfully when authenticated', async () => {
			const { cookies } = await registerAndGetCookies(app);

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/logout',
				headers: { cookie: cookies }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json<{ message: string }>().message).toBe('Logged out successfully');
		});
	});

	describe('POST /api/v1/auth/logout-all', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/logout-all'
			});

			expect(response.statusCode).toBe(401);
		});

		it('should logout from all devices when authenticated', async () => {
			const { cookies } = await registerAndGetCookies(app);

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/logout-all',
				headers: { cookie: cookies }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json<{ message: string }>().message).toBe('Logged out from all devices successfully');
		});
	});

	describe('POST /api/v1/auth/forgot-password', () => {
		it('should return 200 even for a non-existent email (prevents enumeration)', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/forgot-password',
				payload: { email: 'nobody@example.com' }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json<{ message: string }>().message).toContain('password reset link has been sent');
		});

		it('should send a reset email and return 200 for an existing account', async () => {
			const { sendPasswordResetEmail } = await import('../src/services/email');

			await registerUser(app);

			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/forgot-password',
				payload: { email: 'testuser@example.com' }
			});

			expect(response.statusCode).toBe(200);
			expect(sendPasswordResetEmail).toHaveBeenCalledWith('testuser@example.com', expect.any(String));
		});
	});

	describe('POST /api/v1/auth/reset-password', () => {
		it('should return 400 for an invalid or malformed token', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/auth/reset-password',
				payload: { token: 'not-a-valid-jwt', password: TEST_PASSWORD }
			});

			expect(response.statusCode).toBe(400);
			expect(response.json<{ message: string }>().message).toBe('Invalid or expired reset token');
		});
	});

	describe('GET /', () => {
		it('should return server health status', async () => {
			const response = await app.inject({ method: 'GET', url: '/' });

			expect(response.statusCode).toBe(200);
			expect(response.json<{ status: string }>().status).toBe('ok');
		});
	});

	describe('Authentication middleware', () => {
		it('should reject requests with an expired/invalid access token', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/user/current',
				headers: { cookie: 'access-token=invalidtoken' }
			});

			expect(response.statusCode).toBe(401);
		});

		it('should reject requests with no access token', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/user/current'
			});

			expect(response.statusCode).toBe(401);
			expect(response.json<{ message: string }>().message).toContain('Not authorized');
		});
	});
});
