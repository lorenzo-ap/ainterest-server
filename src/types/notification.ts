export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT'
}

export interface Notification {
	id: string;
	userId: string;
	type: NotificationType;
	read: boolean;
	actor: NotificationActor;
	post: NotificationPost;
	createdAt: Date;
	updatedAt: Date;
}

export interface NotificationActor {
	id: string;
	username: string;
	photo: string;
}

export interface NotificationPost {
	id: string;
	photo: string;
}

export interface CreateNotificationBody {
	userId: string;
	type: NotificationType;
	actor: string;
	post: NotificationPost;
}
