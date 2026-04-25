import type { CreateNotificationBody } from '../../types';
import { NotificationModel } from './notification.model';
import { sseManager } from './sse.service';

const NOTIFICATION_USER_PROJECTION = 'username photo';

export const listNotifications = async (userId: string) =>
	NotificationModel.find({ userId }).populate('actor', NOTIFICATION_USER_PROJECTION).sort({ createdAt: -1 }).limit(50);

export const countUnreadNotifications = async (userId: string) =>
	NotificationModel.countDocuments({ userId, read: false });

export const markNotificationRead = async (notificationId: string, userId: string) =>
	NotificationModel.findOneAndUpdate({ _id: notificationId, userId }, { read: true }, { new: true });

export const markAllNotificationsRead = async (userId: string) =>
	NotificationModel.updateMany({ userId, read: false }, { read: true });

export const deleteUserNotification = async (notificationId: string, userId: string) =>
	NotificationModel.findOneAndDelete({ _id: notificationId, userId });

export const deleteUserNotifications = async (userId: string) => NotificationModel.deleteMany({ userId });

export const createNotification = async (body: CreateNotificationBody): Promise<void> => {
	try {
		const notification = await NotificationModel.create(body);
		await notification.populate('actor', NOTIFICATION_USER_PROJECTION);

		sseManager.emitNotification(notification);
	} catch (error) {
		console.error('Error creating notification:', error);
	}
};
