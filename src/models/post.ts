import mongoose, { Document } from 'mongoose';

export interface IPostUser {
	_id: mongoose.Types.ObjectId;
	username: string;
	email: string;
	photo?: string;
}

export interface IPost extends Document {
	_id: mongoose.Types.ObjectId;
	user: IPostUser;
	prompt: string;
	photo: string;
	likes: mongoose.Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

const postSchema = new mongoose.Schema(
	{
		user: {
			type: {
				_id: { type: mongoose.Schema.Types.ObjectId, required: true },
				username: { type: String, required: true },
				email: { type: String, required: true },
				photo: { type: String }
			},
			required: true
		},
		prompt: { type: String, required: [true, 'Please add a prompt'] },
		photo: { type: String, required: [true, 'Please add a photo'] },
		likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
	},
	{
		timestamps: true
	}
);

export const Post = mongoose.model<IPost>('Post', postSchema);
