import type { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTestApp, clearDatabase } from './helpers/app';
import { registerAndGetCookies, TEST_PASSWORD } from './helpers/auth';

vi.mock('cloudinary', () => ({
	v2: {
		config: vi.fn(),
		uploader: {
			upload: vi.fn().mockResolvedValue({
				secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
				public_id: 'test-image-id'
			})
		}
	}
}));

// Minimal valid 1x1 PNG as a base64 data URL (110 chars, satisfies min:100)
const DUMMY_PHOTO =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('Post Routes', () => {
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

	describe('GET /api/v1/post', () => {
		it('should return an empty array when no posts exist', async () => {
			const response = await app.inject({ method: 'GET', url: '/api/v1/post' });

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual([]);
		});

		it('should return all existing posts', async () => {
			await app.inject({
				method: 'POST',
				url: '/api/v1/post',
				headers: { cookie: userCookies },
				payload: { prompt: 'A beautiful sunset', photo: DUMMY_PHOTO }
			});

			const response = await app.inject({ method: 'GET', url: '/api/v1/post' });

			expect(response.statusCode).toBe(200);
			const posts = response.json<{ prompt: string }[]>();
			expect(posts).toHaveLength(1);
			expect(posts[0].prompt).toBe('A beautiful sunset');
		});
	});

	describe('GET /api/v1/post/:id', () => {
		it('should return posts belonging to a specific user', async () => {
			await app.inject({
				method: 'POST',
				url: '/api/v1/post',
				headers: { cookie: userCookies },
				payload: { prompt: 'User specific post', photo: DUMMY_PHOTO }
			});

			const response = await app.inject({
				method: 'GET',
				url: `/api/v1/post/${userId}`
			});

			expect(response.statusCode).toBe(200);
			const posts = response.json<{ prompt: string }[]>();
			expect(posts).toHaveLength(1);
			expect(posts[0].prompt).toBe('User specific post');
		});

		it('should return an empty array for a user with no posts', async () => {
			const otherId = new Types.ObjectId().toString();
			const response = await app.inject({
				method: 'GET',
				url: `/api/v1/post/${otherId}`
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual([]);
		});

		it('should return 400 for an invalid (non-ObjectId) user id', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/post/not-a-valid-id'
			});

			expect(response.statusCode).toBe(400);
		});
	});

	describe('POST /api/v1/post', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/post',
				payload: { prompt: 'A nice image', photo: DUMMY_PHOTO }
			});

			expect(response.statusCode).toBe(401);
		});

		it('should create a post and return 201', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/post',
				headers: { cookie: userCookies },
				payload: { prompt: 'A nice image', photo: DUMMY_PHOTO }
			});

			expect(response.statusCode).toBe(201);
			const body = response.json<{ prompt: string; photo: string; likes: unknown[] }>();
			expect(body.prompt).toBe('A nice image');
			expect(body.photo).toBe('https://res.cloudinary.com/test/image/upload/test.jpg');
			expect(body.likes).toEqual([]);
		});

		it('should return 400 when the prompt is too short', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/post',
				headers: { cookie: userCookies },
				payload: { prompt: 'Hi', photo: DUMMY_PHOTO }
			});

			expect(response.statusCode).toBe(400);
		});

		it('should return 400 for an invalid (non-base64) photo', async () => {
			const response = await app.inject({
				method: 'POST',
				url: '/api/v1/post',
				headers: { cookie: userCookies },
				payload: { prompt: 'A nice image', photo: 'not-a-base64-image' }
			});

			expect(response.statusCode).toBe(400);
		});
	});

	describe('PUT /api/v1/post/:id (like/unlike)', () => {
		let postId: string;
		let otherUserCookies: string;

		beforeEach(async () => {
			const createResponse = await app.inject({
				method: 'POST',
				url: '/api/v1/post',
				headers: { cookie: userCookies },
				payload: { prompt: 'A likeable post', photo: DUMMY_PHOTO }
			});
			postId = createResponse.json<{ id: string }>().id;

			const result = await registerAndGetCookies(app, {
				username: 'otheruser',
				email: 'other@example.com',
				password: TEST_PASSWORD
			});
			otherUserCookies = result.cookies;
		});

		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'PUT',
				url: `/api/v1/post/${postId}`
			});

			expect(response.statusCode).toBe(401);
		});

		it('should like a post and return the updated post', async () => {
			const response = await app.inject({
				method: 'PUT',
				url: `/api/v1/post/${postId}`,
				headers: { cookie: otherUserCookies }
			});

			expect(response.statusCode).toBe(200);
			const body = response.json<{ likes: string[] }>();
			expect(body.likes).toHaveLength(1);
		});

		it('should unlike a post when already liked', async () => {
			// Like first
			await app.inject({
				method: 'PUT',
				url: `/api/v1/post/${postId}`,
				headers: { cookie: otherUserCookies }
			});

			// Unlike
			const response = await app.inject({
				method: 'PUT',
				url: `/api/v1/post/${postId}`,
				headers: { cookie: otherUserCookies }
			});

			expect(response.statusCode).toBe(200);
			const body = response.json<{ likes: string[] }>();
			expect(body.likes).toHaveLength(0);
		});

		it('should return 404 for a non-existent post id', async () => {
			const nonExistentId = new Types.ObjectId().toString();
			const response = await app.inject({
				method: 'PUT',
				url: `/api/v1/post/${nonExistentId}`,
				headers: { cookie: userCookies }
			});

			expect(response.statusCode).toBe(404);
			expect(response.json<{ message: string }>().message).toBe('Post not found');
		});
	});

	describe('DELETE /api/v1/post/:id', () => {
		let postId: string;

		beforeEach(async () => {
			const createResponse = await app.inject({
				method: 'POST',
				url: '/api/v1/post',
				headers: { cookie: userCookies },
				payload: { prompt: 'Post to delete', photo: DUMMY_PHOTO }
			});
			postId = createResponse.json<{ id: string }>().id;
		});

		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'DELETE',
				url: `/api/v1/post/${postId}`
			});

			expect(response.statusCode).toBe(401);
		});

		it('should delete the post when the owner requests it', async () => {
			const response = await app.inject({
				method: 'DELETE',
				url: `/api/v1/post/${postId}`,
				headers: { cookie: userCookies }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json<{ message: string }>().message).toBe('Post deleted');
		});

		it('should return 403 when a non-owner non-admin tries to delete', async () => {
			const { cookies: otherCookies } = await registerAndGetCookies(app, {
				username: 'otheruser',
				email: 'other@example.com',
				password: TEST_PASSWORD
			});

			const response = await app.inject({
				method: 'DELETE',
				url: `/api/v1/post/${postId}`,
				headers: { cookie: otherCookies }
			});

			expect(response.statusCode).toBe(403);
			expect(response.json<{ message: string }>().message).toBe('Unauthorized to delete this post');
		});

		it('should return 404 for a non-existent post id', async () => {
			const nonExistentId = new Types.ObjectId().toString();
			const response = await app.inject({
				method: 'DELETE',
				url: `/api/v1/post/${nonExistentId}`,
				headers: { cookie: userCookies }
			});

			expect(response.statusCode).toBe(404);
			expect(response.json<{ message: string }>().message).toBe('Post not found');
		});
	});
});
