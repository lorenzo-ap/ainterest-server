import type { Ref } from './common';
import type { Post, PostUser } from './post';

export interface Comment {
	id: string;
	text: string;
	author: Ref<PostUser>;
	post: Ref<Post>;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateCommentBody {
	text: string;
}
