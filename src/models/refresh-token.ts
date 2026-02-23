import { model, Schema } from 'mongoose';
import type { RefreshToken } from '../types';

const refreshTokenSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true
		},
		token: {
			type: String,
			required: true,
			unique: true
		},
		expiresAt: {
			type: Date,
			required: true
		}
	},
	{
		methods: {
			isExpired: function () {
				return this.expiresAt < new Date();
			}
		},
		timestamps: true
	}
);

export const RefreshTokenModel = model<RefreshToken>('RefreshToken', refreshTokenSchema);
