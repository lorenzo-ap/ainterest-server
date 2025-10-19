import mongoose, { Document } from 'mongoose';

export interface IRefreshToken extends Document {
	_id: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	token: string;
	expiresAt: Date;
	createdAt: Date;
	deviceInfo?: string;
	isExpired(): boolean;
}

const refreshTokenSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
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
		},
		deviceInfo: {
			type: String,
			default: ''
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

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
