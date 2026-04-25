import type { FastifyInstance } from 'fastify';
import { protect } from '../../hooks';
import { idParamSchema } from '../../schemas';
import type { IdParam } from '../../types';
import {
	deleteAllNotifications,
	deleteNotification,
	getNotifications,
	getUnreadCount,
	markAllNotificationsAsRead,
	markNotificationAsRead,
	streamNotifications
} from './notifications.controller';

export async function notificationRoutes(server: FastifyInstance) {
	server.get('/', { preHandler: protect }, getNotifications);
	server.get('/unread-count', { preHandler: protect }, getUnreadCount);
	server.get('/stream', { preHandler: protect }, streamNotifications);

	server.put<IdParam>('/:id/read', { schema: idParamSchema, preHandler: protect }, markNotificationAsRead);
	server.delete<IdParam>('/:id', { schema: idParamSchema, preHandler: protect }, deleteNotification);

	server.put('/mark-all-read', { preHandler: protect }, markAllNotificationsAsRead);
	server.delete('/delete-all', { preHandler: protect }, deleteAllNotifications);
}
