import { Schema, Types, model } from 'mongoose';

export interface IPostUser {
	_id: Types.ObjectId;
	username: string;
	email: string;
	photo?: string;
}

export interface IPost {
	_id: Types.ObjectId;
	user: IPostUser;
	prompt: string;
	photo: string;
	likes: Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

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

export const Post = model<IPost>('Post', postSchema);
