import type { ObjectId } from 'mongoose';

export interface Notification {
	_id: ObjectId;
	userId: ObjectId;
	actorId: ObjectId;
	actorUsername: string;
	actorPhoto: string;
	type: NotificationType.LIKE;
	postId: ObjectId;
	postPhoto: string;
	read: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export enum NotificationType {
	LIKE = 'LIKE'
}

export interface CreateNotificationBody {
	userId: string;
	actorId: string;
	actorUsername: string;
	actorPhoto: string;
	type: NotificationType;
	postId: string;
	postPhoto: string;
}
