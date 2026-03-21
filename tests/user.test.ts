import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTestApp, clearDatabase } from './helpers/app';
import { registerAndGetCookies, registerUser, TEST_PASSWORD } from './helpers/auth';

vi.mock('cloudinary', () => ({
	v2: {
		config: vi.fn(),
		uploader: {
			upload: vi.fn().mockResolvedValue({
				secure_url: 'https://res.cloudinary.com/test/image/upload/avatar.jpg',
				public_id: 'test-avatar-id'
			})
		}
	}
}));

// Minimal valid 1x1 PNG as a base64 data URL
const DUMMY_PHOTO =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('User Routes', () => {
	let app: FastifyInstance;
	let userCookies: string;
	let userId: string;

	beforeAll(async () => {
		app = await buildTestApp();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await clearDatabase();
		const result = await registerAndGetCookies(app);
		userCookies = result.cookies;
		userId = result.id;
	});

	describe('GET /api/v1/user/current', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/user/current'
			});

			expect(response.statusCode).toBe(401);
		});

		it('should return the current authenticated user', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/user/current',
				headers: { cookie: userCookies }
			});

			expect(response.statusCode).toBe(200);
			const body = response.json<{ id: string; username: string; email: string; role: string }>();
			expect(body.id).toBe(userId);
			expect(body.username).toBe('testuser');
			expect(body.email).toBe('testuser@example.com');
			expect(body.role).toBe('user');
		});
	});

	describe('GET /api/v1/user/:username', () => {
		it('should return a user by username', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/user/testuser'
			});

			expect(response.statusCode).toBe(200);
			const body = response.json<{ id: string; username: string; email: string }>();
			expect(body.id).toBe(userId);
			expect(body.username).toBe('testuser');
			expect(body.email).toBe('testuser@example.com');
		});

		it('should return 400 for a non-existent username', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/user/doesnotexist'
			});

			expect(response.statusCode).toBe(400);
			expect(response.json<{ message: string }>().message).toBe('User not found');
		});

		it('should return 400 for a username that is too short', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/user/ab'
			});

			expect(response.statusCode).toBe(400);
		});
	});

	describe('PUT /api/v1/user/edit', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/user/edit',
				payload: { username: 'newname' }
			});

			expect(response.statusCode).toBe(401);
		});

		it('should update the username', async () => {
			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/user/edit',
				headers: { cookie: userCookies },
				payload: { username: 'updateduser' }
			});

			expect(response.statusCode).toBe(200);
			const body = response.json<{ username: string }>();
			expect(body.username).toBe('updateduser');
		});

		it('should update the email', async () => {
			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/user/edit',
				headers: { cookie: userCookies },
				payload: { email: 'newemail@example.com' }
			});

			expect(response.statusCode).toBe(200);
			const body = response.json<{ email: string }>();
			expect(body.email).toBe('newemail@example.com');
		});

		it('should update the photo via Cloudinary', async () => {
			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/user/edit',
				headers: { cookie: userCookies },
				payload: { photo: DUMMY_PHOTO }
			});

			expect(response.statusCode).toBe(200);
			const body = response.json<{ photo: string }>();
			expect(body.photo).toBe('https://res.cloudinary.com/test/image/upload/avatar.jpg');
		});

		it('should return 400 for an invalid email format', async () => {
			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/user/edit',
				headers: { cookie: userCookies },
				payload: { email: 'not-an-email' }
			});

			expect(response.statusCode).toBe(400);
		});
	});

	describe('User registration uniqueness across users', () => {
		it('should create separate users with unique credentials', async () => {
			const response = await registerUser(app, {
				username: 'seconduser',
				email: 'second@example.com',
				password: TEST_PASSWORD
			});

			expect(response.statusCode).toBe(201);
			const body = response.json<{ id: string; username: string }>();
			expect(body.id).not.toBe(userId);
			expect(body.username).toBe('seconduser');
		});
	});
});
