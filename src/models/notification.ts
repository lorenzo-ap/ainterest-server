import { Schema, Types, model } from 'mongoose';
import { NotificationType } from '../types';

export interface INotification {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	actorId: Types.ObjectId;
	actorUsername: string;
	actorPhoto: string;
	type: NotificationType.LIKE;
	postId: Types.ObjectId;
	postPhoto: string;
	read: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const notificationSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true
		},
		actorId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		actorUsername: {
			type: String,
			required: true
		},
		actorPhoto: {
			type: String,
			default: ''
		},
		type: {
			type: String,
			enum: ['like'],
			required: true
		},
		postId: {
			type: Schema.Types.ObjectId,
			ref: 'Post',
			required: true
		},
		postPhoto: {
			type: String,
			required: true
		},
		read: {
			type: Boolean,
			default: false
		}
	},
	{
		timestamps: true
	}
);

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
