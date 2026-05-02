import { model, Schema } from 'mongoose';
import type { Post } from '../../types';

const postSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
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
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

postSchema.virtual('likesCount').get(function (this: Post) {
	return this.likes ? this.likes.length : 0;
});

postSchema.virtual('commentsCount', {
	ref: 'Comment',
	localField: '_id',
	foreignField: 'post',
	count: true
});

export const PostModel = model<Post>('Post', postSchema);
