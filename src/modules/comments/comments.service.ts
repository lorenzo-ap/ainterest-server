import type { CreateCommentBody } from '../../types';
import { type CreateNotificationBody, NotificationType, UserRole } from '../../types';
import { createNotification } from '../notifications/notifications.service';
import { PostModel } from '../posts/post.model';
import { CommentModel } from './comment.model';

const COMMENT_AUTHOR_PROJECTION = 'username email photo';

export const createComment = async (postId: string, authorId: string, body: CreateCommentBody) => {
	const post = await PostModel.findById(postId);
	if (!post) {
		return { status: 404, body: { message: 'Post not found' } };
	}

	const newComment = await CommentModel.create({
		text: body.text,
		author: authorId,
		post: postId
	});

	await newComment.populate('author', COMMENT_AUTHOR_PROJECTION);

	const postUserId = String(post.user);
	const isOwnPost = postUserId === authorId;

	if (!isOwnPost) {
		const notificationBody = {
			userId: postUserId,
			type: NotificationType.COMMENT,
			actor: authorId,
			post: {
				id: post.id,
				photo: post.photo
			}
		} satisfies CreateNotificationBody;

		createNotification(notificationBody).catch((error) => {
			console.error('Failed to create notification:', error);
		});
	}

	return { status: 201, body: newComment };
};

export const getCommentsByPostId = async (postId: string) => {
	const comments = await CommentModel.find({ post: postId }).populate('author', COMMENT_AUTHOR_PROJECTION);

	return comments;
};

export const deleteComment = async (commentId: string, currentUserId: string, currentUserRole: UserRole) => {
	const comment = await CommentModel.findById(commentId);

	if (!comment) {
		return { status: 404, body: { message: 'Comment not found' } };
	}

	const isOwner = String(comment.author) === currentUserId;
	const isAdmin = currentUserRole === UserRole.Admin;

	if (!isOwner && !isAdmin) {
		return { status: 403, body: { message: 'Unauthorized to delete this comment' } };
	}

	await CommentModel.findByIdAndDelete(commentId);

	return { status: 200, body: { message: 'Comment deleted' } };
};
