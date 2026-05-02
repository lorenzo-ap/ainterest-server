import { v2 as cloudinary } from 'cloudinary';
import type { IdParam } from '../../types';
import { type CreateNotificationBody, NotificationType, UserRole } from '../../types';
import { NotificationModel } from '../notifications/notification.model';
import { createNotification } from '../notifications/notifications.service';
import { PostModel } from './post.model';
import { toPostResponse } from './posts.serializer';
import type { CreatePostBody } from './posts.types';

const POST_USER_PROJECTION = 'username email photo';

export const listPosts = async (viewerId?: string) => {
	const posts = await PostModel.find({}).populate('user', POST_USER_PROJECTION).populate('commentsCount');
	return posts.map((post) => toPostResponse(post, viewerId));
};

export const listUserPosts = async (userId: IdParam['Params']['id'], viewerId?: string) => {
	const posts = await PostModel.find({ user: userId }).populate('user', POST_USER_PROJECTION).populate('commentsCount');
	return posts.map((post) => toPostResponse(post, viewerId));
};

export const createUserPost = async (userId: string, body: CreatePostBody) => {
	const cloudinaryPhoto = await cloudinary.uploader.upload(body.photo);
	const newPost = await PostModel.create({
		user: userId,
		prompt: body.prompt,
		photo: cloudinaryPhoto.secure_url
	});

	await newPost.populate([{ path: 'user', select: POST_USER_PROJECTION }, { path: 'commentsCount' }]);

	return toPostResponse(newPost, userId);
};

export const deleteUserPost = async (postId: string, currentUserId: string, currentUserRole: UserRole) => {
	const post = await PostModel.findById(postId);

	if (!post) {
		return { status: 404, body: { message: 'Post not found' } };
	}

	const isOwner = String(post.user) === currentUserId;
	const isAdmin = currentUserRole === UserRole.Admin;

	if (!isOwner && !isAdmin) {
		return { status: 403, body: { message: 'Unauthorized to delete this post' } };
	}

	await PostModel.findByIdAndDelete(postId);
	await NotificationModel.deleteMany({ 'post.id': postId });

	return { status: 200, body: { message: 'Post deleted' } };
};

export const togglePostLike = async (postId: string, currentUserId: string) => {
	const post = await PostModel.findById(postId);

	if (!post) {
		return { status: 404, body: { message: 'Post not found' } };
	}

	const isAlreadyLiked = post.likes.some((like) => String(like) === currentUserId);

	if (!isAlreadyLiked) {
		post.likes.push(currentUserId);

		const postUserId = String(post.user);
		const isOwnPost = postUserId === currentUserId;

		if (!isOwnPost) {
			const notificationBody = {
				userId: postUserId,
				type: NotificationType.LIKE,
				actor: currentUserId,
				post: {
					id: post.id,
					photo: post.photo
				}
			} satisfies CreateNotificationBody;

			createNotification(notificationBody).catch((error) => {
				console.error('Failed to create notification:', error);
			});
		}
	} else {
		post.likes = post.likes.filter((like) => String(like) !== currentUserId);
	}

	await post.save();
	await post.populate([{ path: 'user', select: POST_USER_PROJECTION }, { path: 'commentsCount' }]);

	return { status: 200, body: toPostResponse(post, currentUserId) };
};
