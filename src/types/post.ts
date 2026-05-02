import type { Ref } from './common';

export interface PostUser {
	id: string;
	username: string;
	email: string;
	photo?: string;
}

export interface Post {
	id: string;
	user: Ref<PostUser>;
	prompt: string;
	photo: string;
	likes: string[];
	likesCount: number;
	commentsCount: number;
	createdAt: Date;
	updatedAt: Date;
}
