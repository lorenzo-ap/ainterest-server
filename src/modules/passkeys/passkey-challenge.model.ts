import { model, Schema } from 'mongoose';
import type { PasskeyChallenge } from '../../types';

const passkeyChallengeSchema = new Schema(
	{
		challenge: {
			type: String,
			required: true,
			index: true
		},
		type: {
			type: String,
			enum: ['registration', 'authentication'],
			required: true,
			index: true
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			index: true
		},
		email: {
			type: String,
			required: true,
			index: true
		},
		expiresAt: {
			type: Date,
			required: true,
			index: { expires: 0 }
		}
	},
	{
		timestamps: true
	}
);

export const PasskeyChallengeModel = model<PasskeyChallenge>('PasskeyChallenge', passkeyChallengeSchema);
