import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotificationModel } from '../models';
import { sseManager } from '../services';
import type { CreateNotificationBody, IdParam } from '../types';

/**
 * @desc Get user's notifications
 * @route GET /api/v1/notifications
 * @access Private
 */
export const getNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const userId = request.user._id;

		const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();

		return reply.status(200).send(notifications);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error fetching notifications' });
	}
};

/**
 * @desc Get count of unread notifications
 * @route GET /api/v1/notifications/unread-count
 * @access Private
 */
export const getUnreadCount = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const userId = request.user._id;
		const count = await NotificationModel.countDocuments({ userId, read: false });

		return reply.status(200).send({ count });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error fetching unread count' });
	}
};

/**
 * @desc Mark single notification as read
 * @route PUT /api/v1/notifications/:id/read
 * @access Private
 */
export const markNotificationAsRead = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const userId = request.user._id;

		const notification = await NotificationModel.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });

		if (!notification) {
			return reply.status(404).send({ message: 'Notification not found' });
		}

		return reply.status(200).send(notification);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error marking notification as read' });
	}
};

/**
 * @desc Mark all user's notifications as read
 * @route PUT /api/v1/notifications/mark-all-read
 * @access Private
 */
export const markAllNotificationsAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const userId = request.user._id;

		const result = await NotificationModel.updateMany({ userId, read: false }, { read: true });

		return reply.status(200).send({ modifiedCount: result.modifiedCount });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error marking all notifications as read' });
	}
};

/**
 * @desc Delete a notification
 * @route DELETE /api/v1/notifications/:id
 * @access Private
 */
export const deleteNotification = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const { id } = request.params;
		const userId = request.user._id;

		const notification = await NotificationModel.findOneAndDelete({ _id: id, userId });

		if (!notification) {
			return reply.status(404).send({ message: 'Notification not found' });
		}

		return reply.status(200).send(notification);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error deleting notification' });
	}
};

/**
 * @desc Delete all user's notifications
 * @route DELETE /api/v1/notifications/delete-all
 * @access Private
 */
export const deleteAllNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const userId = request.user._id;

		const result = await NotificationModel.deleteMany({ userId });

		return reply.status(200).send({ deletedCount: result.deletedCount });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error deleting all notifications' });
	}
};

/**
 * @desc Establish SSE connection for real-time notifications
 * @route GET /api/v1/notifications/stream
 * @access Private
 */
export const streamNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const userId = request.user._id.toString();

		const frontendUrl = process.env.FRONTEND_URL;
		sseManager.addConnection(userId, reply, frontendUrl);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error establishing SSE connection' });
	}
};

/**
 * Helper function to create and emit a notification
 */
export const createNotification = async (body: CreateNotificationBody): Promise<void> => {
	try {
		const notification = await NotificationModel.create({
			userId: body.userId,
			actorId: body.actorId,
			actorUsername: body.actorUsername,
			actorPhoto: body.actorPhoto,
			type: body.type,
			postId: body.postId,
			postPhoto: body.postPhoto,
			read: false
		});

		sseManager.emitNotification(body.userId, notification);
	} catch (error) {
		console.error('Error creating notification:', error);
	}
};
