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
		type: {
			type: String,
			enum: ['LIKE'],
			required: true
		},
		read: {
			type: Boolean,
			default: false
		},
		actor: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		post: {
			type: {
				id: {
					type: Schema.Types.ObjectId,
					ref: 'Post',
					required: true
				},
				photo: {
					type: String,
					required: true
				}
			},
			required: true,
			_id: false
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
