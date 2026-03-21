import type { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationModel } from '../src/models';
import { buildTestApp, clearDatabase } from './helpers/app';
import { registerAndGetCookies, TEST_PASSWORD } from './helpers/auth';

// Suppress SSE-related cloudinary config (not needed for notification tests)
vi.mock('cloudinary', () => ({
	v2: {
		config: vi.fn(),
		uploader: { upload: vi.fn() }
	}
}));

describe('Notification Routes', () => {
	let app: FastifyInstance;
	let aliceCookies: string;
	let aliceId: string;

	beforeAll(async () => {
		app = await buildTestApp();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await clearDatabase();
		const result = await registerAndGetCookies(app, {
			username: 'alice',
			email: 'alice@example.com',
			password: TEST_PASSWORD
		});
		aliceCookies = result.cookies;
		aliceId = result.id;
	});

	async function seedNotification(
		overrides: Partial<{
			userId: string;
			actorId: string;
			postId: string;
			read: boolean;
		}> = {}
	) {
		return NotificationModel.create({
			userId: overrides.userId ?? aliceId,
			actorId: overrides.actorId ?? new Types.ObjectId().toString(),
			actorUsername: 'bob',
			actorPhoto: '',
			type: 'LIKE',
			postId: overrides.postId ?? new Types.ObjectId().toString(),
			postPhoto: 'https://example.com/photo.jpg',
			read: overrides.read ?? false
		});
	}

	describe('GET /api/v1/notification', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/notification'
			});

			expect(response.statusCode).toBe(401);
		});

		it('should return an empty array when there are no notifications', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/notification',
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual([]);
		});

		it('should return the user notifications', async () => {
			await seedNotification();

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/notification',
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(200);
			const notifications = response.json<{ type: string }[]>();
			expect(notifications).toHaveLength(1);
			expect(notifications[0].type).toBe('LIKE');
		});
	});

	describe('GET /api/v1/notification/unread-count', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/notification/unread-count'
			});

			expect(response.statusCode).toBe(401);
		});

		it('should return 0 when there are no unread notifications', async () => {
			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/notification/unread-count',
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json<{ count: number }>().count).toBe(0);
		});

		it('should return the correct count of unread notifications', async () => {
			await seedNotification({ read: false });
			await seedNotification({ read: false });
			await seedNotification({ read: true });

			const response = await app.inject({
				method: 'GET',
				url: '/api/v1/notification/unread-count',
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json<{ count: number }>().count).toBe(2);
		});
	});

	describe('PUT /api/v1/notification/:id/read', () => {
		it('should return 401 when not authenticated', async () => {
			const notifId = new Types.ObjectId().toString();
			const response = await app.inject({
				method: 'PUT',
				url: `/api/v1/notification/${notifId}/read`
			});

			expect(response.statusCode).toBe(401);
		});

		it('should mark a notification as read', async () => {
			const notification = await seedNotification({ read: false });
			const notifId = notification._id.toString();

			const response = await app.inject({
				method: 'PUT',
				url: `/api/v1/notification/${notifId}/read`,
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(200);
			const body = response.json<{ read: boolean }>();
			expect(body.read).toBe(true);
		});

		it('should return 404 for a non-existent notification', async () => {
			const nonExistentId = new Types.ObjectId().toString();

			const response = await app.inject({
				method: 'PUT',
				url: `/api/v1/notification/${nonExistentId}/read`,
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe('PUT /api/v1/notification/mark-all-read', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/notification/mark-all-read'
			});

			expect(response.statusCode).toBe(401);
		});

		it('should mark all unread notifications as read', async () => {
			await seedNotification({ read: false });
			await seedNotification({ read: false });

			const response = await app.inject({
				method: 'PUT',
				url: '/api/v1/notification/mark-all-read',
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json<{ modifiedCount: number }>().modifiedCount).toBe(2);

			const countAfter = await NotificationModel.countDocuments({ userId: aliceId, read: false });
			expect(countAfter).toBe(0);
		});
	});

	describe('DELETE /api/v1/notification/:id', () => {
		it('should return 401 when not authenticated', async () => {
			const notifId = new Types.ObjectId().toString();
			const response = await app.inject({
				method: 'DELETE',
				url: `/api/v1/notification/${notifId}`
			});

			expect(response.statusCode).toBe(401);
		});

		it('should delete a notification', async () => {
			const notification = await seedNotification();
			const notifId = notification._id.toString();

			const response = await app.inject({
				method: 'DELETE',
				url: `/api/v1/notification/${notifId}`,
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(200);

			const remaining = await NotificationModel.countDocuments({ userId: aliceId });
			expect(remaining).toBe(0);
		});

		it('should return 404 for a non-existent notification', async () => {
			const nonExistentId = new Types.ObjectId().toString();

			const response = await app.inject({
				method: 'DELETE',
				url: `/api/v1/notification/${nonExistentId}`,
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe('DELETE /api/v1/notification/delete-all', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await app.inject({
				method: 'DELETE',
				url: '/api/v1/notification/delete-all'
			});

			expect(response.statusCode).toBe(401);
		});

		it('should delete all notifications for the current user', async () => {
			await seedNotification();
			await seedNotification();

			const response = await app.inject({
				method: 'DELETE',
				url: '/api/v1/notification/delete-all',
				headers: { cookie: aliceCookies }
			});

			expect(response.statusCode).toBe(200);
			expect(response.json<{ deletedCount: number }>().deletedCount).toBe(2);

			const remaining = await NotificationModel.countDocuments({ userId: aliceId });
			expect(remaining).toBe(0);
		});

		it('should only delete notifications belonging to the current user', async () => {
			// Seed a notification for alice
			await seedNotification({ userId: aliceId });

			// Seed a notification for another user
			const otherId = new Types.ObjectId().toString();
			await seedNotification({ userId: otherId });

			await app.inject({
				method: 'DELETE',
				url: '/api/v1/notification/delete-all',
				headers: { cookie: aliceCookies }
			});

			const otherRemaining = await NotificationModel.countDocuments({ userId: otherId });
			expect(otherRemaining).toBe(1);
		});
	});
});
