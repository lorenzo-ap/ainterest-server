type PostWithLikes = {
	likes?: unknown[];
	toObject?: () => Record<string, unknown>;
};

export const toPostResponse = <T extends PostWithLikes>(post: T, currentUserId?: string) => {
	const serializedPost = typeof post.toObject === 'function' ? post.toObject() : post;
	const likesArray = Array.isArray(serializedPost.likes) ? serializedPost.likes : [];
	const likedByCurrentUser = currentUserId ? likesArray.some((like) => String(like) === currentUserId) : false;
	const { likes: _likes, ...postWithoutLikes } = serializedPost;

	return {
		...postWithoutLikes,
		likesCount: likesArray.length,
		likedByCurrentUser
	};
};
