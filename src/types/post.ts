import type { ObjectId } from 'mongoose';
import type { RouteWithBody } from './http';

export interface PostUser {
	_id: ObjectId;
	username: string;
	email: string;
	photo?: string;
}

export interface Post {
	_id: ObjectId;
	user: PostUser;
	prompt: string;
	photo: string;
	likes: ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CreatePostBody {
	prompt: string;
	photo: string;
}

export type CreatePostRoute = RouteWithBody<CreatePostBody>;
