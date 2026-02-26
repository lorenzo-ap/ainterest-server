import type { z } from 'zod';
import type { createPostSchema } from '../schemas';
import type { RouteWithBody } from './http';

export interface PostUser {
	id: string;
	username: string;
	email: string;
	photo?: string;
}

export interface Post {
	id: string;
	user: PostUser;
	prompt: string;
	photo: string;
	likes: string[];
	createdAt: Date;
	updatedAt: Date;
}

export type CreatePostBody = z.infer<typeof createPostSchema.body>;

export type CreatePostRoute = RouteWithBody<CreatePostBody>;
