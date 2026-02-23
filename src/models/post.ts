import { model, Schema } from 'mongoose';
import type { Post } from '../types';

const postSchema = new Schema(
	{
		user: {
			type: {
				_id: {
					type: Schema.Types.ObjectId,
					required: true
				},
				username: {
					type: String,
					required: true
				},
				email: {
					type: String,
					required: true
				},
				photo: {
					type: String
				}
			},
			required: true
		},
		prompt: {
			type: String,
			required: [true, 'Please add a prompt']
		},
		photo: {
			type: String,
			required: [true, 'Please add a photo']
		},
		likes: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User'
			}
		]
	},
	{
		timestamps: true
	}
);

export const PostModel = model<Post>('Post', postSchema);
