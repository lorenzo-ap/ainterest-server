import { model, Schema } from 'mongoose';
import type { Notification } from '../types';

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
			enum: ['LIKE'],
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

export const NotificationModel = model<Notification>('Notification', notificationSchema);
