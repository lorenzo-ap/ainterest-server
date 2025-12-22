import { FastifyReply, FastifyRequest } from 'fastify';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middleware';
import { Notification } from '../models';
import { sseManager } from '../services';
import { CreateNotificationBody, NotificationParams } from '../types';

/**
 * @desc Get user's notifications
 * @route GET /api/v1/notifications
 * @access Private
 */
export const getNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const authenticatedRequest = request as AuthenticatedRequest;
		const userId = authenticatedRequest.user._id;

		const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();

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
		const authenticatedRequest = request as AuthenticatedRequest;
		const userId = authenticatedRequest.user._id;

		const count = await Notification.countDocuments({ userId, read: false });

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
export const markNotificationAsRead = async (request: FastifyRequest<NotificationParams>, reply: FastifyReply) => {
	try {
		const authenticatedRequest = request as AuthenticatedRequest;
		const { id } = request.params;
		const userId = authenticatedRequest.user._id;

		const notification = await Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });

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
		const authenticatedRequest = request as AuthenticatedRequest;
		const userId = authenticatedRequest.user._id;

		const result = await Notification.updateMany({ userId, read: false }, { read: true });

		return reply.status(200).send({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
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
export const deleteNotification = async (request: FastifyRequest<NotificationParams>, reply: FastifyReply) => {
	try {
		const authenticatedRequest = request as AuthenticatedRequest;
		const { id } = request.params;
		const userId = authenticatedRequest.user._id;

		const notification = await Notification.findOneAndDelete({ _id: id, userId });

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
		const authenticatedRequest = request as AuthenticatedRequest;
		const userId = authenticatedRequest.user._id;

		const result = await Notification.deleteMany({ userId });

		return reply.status(200).send({ message: 'All notifications deleted', deletedCount: result.deletedCount });
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
		const authenticatedRequest = request as AuthenticatedRequest;
		const userId = authenticatedRequest.user._id.toString();

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
		const notification = await Notification.create({
			userId: new Types.ObjectId(body.userId),
			actorId: new Types.ObjectId(body.actorId),
			actorUsername: body.actorUsername,
			actorPhoto: body.actorPhoto,
			type: body.type,
			postId: new Types.ObjectId(body.postId),
			postPhoto: body.postPhoto,
			read: false
		});

		sseManager.emitNotification(body.userId, notification);
	} catch (error) {
		console.error('Error creating notification:', error);
	}
};
