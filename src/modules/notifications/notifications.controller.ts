import type { FastifyReply, FastifyRequest } from 'fastify';
import type { IdParam } from '../../types';
import { getEnvString } from '../../utils/utils';
import {
	countUnreadNotifications,
	deleteUserNotification,
	deleteUserNotifications,
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead
} from './notifications.service';
import { sseManager } from './sse.service';

export const getNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const notifications = await listNotifications(request.user.id);
		return reply.status(200).send(notifications);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error fetching notifications' });
	}
};

export const getUnreadCount = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const count = await countUnreadNotifications(request.user.id);
		return reply.status(200).send({ count });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error fetching unread count' });
	}
};

export const markNotificationAsRead = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const notification = await markNotificationRead(request.params.id, request.user.id);

		if (!notification) {
			return reply.status(404).send({ message: 'Notification not found' });
		}

		return reply.status(200).send(notification);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error marking notification as read' });
	}
};

export const markAllNotificationsAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const result = await markAllNotificationsRead(request.user.id);
		return reply.status(200).send({ modifiedCount: result.modifiedCount });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error marking all notifications as read' });
	}
};

export const deleteNotification = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const notification = await deleteUserNotification(request.params.id, request.user.id);

		if (!notification) {
			return reply.status(404).send({ message: 'Notification not found' });
		}

		return reply.status(200).send(notification);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error deleting notification' });
	}
};

export const deleteAllNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const result = await deleteUserNotifications(request.user.id);
		return reply.status(200).send({ deletedCount: result.deletedCount });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error deleting all notifications' });
	}
};

export const streamNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const frontendUrl = getEnvString('FRONTEND_URL');
		sseManager.addConnection(request.user.id, reply, frontendUrl);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error establishing SSE connection' });
	}
};
