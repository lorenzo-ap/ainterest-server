import { Schema, Types, model } from 'mongoose';

export interface IRefreshToken {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	token: string;
	expiresAt: Date;
	createdAt: Date;
	isExpired(): boolean;
}

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

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
