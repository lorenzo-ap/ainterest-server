import { model, Schema } from 'mongoose';
import type { Comment } from '../../types';

const commentSchema = new Schema(
	{
		text: {
			type: String,
			required: [true, 'Please add text to your comment'],
			trim: true
		},
		author: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		post: {
			type: Schema.Types.ObjectId,
			ref: 'Post',
			required: true
		}
	},
	{
		timestamps: true
	}
);

export const CommentModel = model<Comment>('Comment', commentSchema);
