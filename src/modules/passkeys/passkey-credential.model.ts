import { model, Schema } from 'mongoose';
import type { PasskeyCredential } from '../../types';

const passkeyCredentialSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true
		},
		name: {
			type: String,
			required: true
		},
		credentialId: {
			type: String,
			required: true,
			unique: true
		},
		publicKey: {
			type: String,
			required: true
		},
		counter: {
			type: Number,
			required: true
		},
		transports: {
			type: [String],
			default: []
		},
		backedUp: {
			type: Boolean,
			default: false
		},
		lastUsedAt: {
			type: Date
		}
	},
	{
		timestamps: true
	}
);

export const PasskeyCredentialModel = model<PasskeyCredential>('PasskeyCredential', passkeyCredentialSchema);
