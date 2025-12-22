export enum NotificationType {
	LIKE = 'like'
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

export interface NotificationParams {
	Params: {
		id: string;
	};
}
