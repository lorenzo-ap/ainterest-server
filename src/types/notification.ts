export interface Notification {
	id: string;
	userId: string;
	actorId: string;
	actorUsername: string;
	actorPhoto: string;
	type: NotificationType.LIKE;
	postId: string;
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
