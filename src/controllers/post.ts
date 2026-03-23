import { v2 as cloudinary } from 'cloudinary';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotificationModel, PostModel } from '../models';
import { type CreateNotificationBody, type CreatePostRoute, type IdParam, NotificationType, UserRole } from '../types';
import { createNotification } from './notification';

const POST_USER_PROJECTION = 'username email photo';

/**
	@desc Get all posts
	@route GET /api/v1/posts
	@access Public
**/
export const getPosts = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const posts = await PostModel.find({}).populate('user', POST_USER_PROJECTION);

		return reply.status(200).send(posts);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send(error);
	}
};

/**
	@desc Get user posts
	@route GET /api/v1/posts/:id
	@access Public
**/
export const getUserPosts = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const { id } = request.params;

		const posts = await PostModel.find({ user: id }).populate('user', POST_USER_PROJECTION);

		return reply.status(200).send(posts);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send(error);
	}
};

/**
	@desc Create post
	@route POST /api/v1/posts
	@access Private
**/
export const createPost = async (request: FastifyRequest<CreatePostRoute>, reply: FastifyReply) => {
	try {
		const { prompt, photo } = request.body;
		const { id } = request.user;

		const cloudinaryPhoto = await cloudinary.uploader.upload(photo);
		const newPost = await PostModel.create({
			user: id,
			prompt,
			photo: cloudinaryPhoto.secure_url
		});

		await newPost.populate('user', POST_USER_PROJECTION);

		return reply.status(201).send(newPost);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send(error);
	}
};

/**
	@desc Delete post
	@route DELETE /api/v1/posts/:id
	@access Private
**/
export const deletePost = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const { id } = request.params;

		const post = await PostModel.findById(id);

		if (!post) {
			return reply.status(404).send({ message: 'Post not found' });
		}

		const isOwner = String(post.user) === request.user.id;
		const isAdmin = request.user.role === UserRole.Admin;

		if (!isOwner && !isAdmin) {
			return reply.status(403).send({ message: 'Unauthorized to delete this post' });
		}

		await PostModel.findByIdAndDelete(id);
		await NotificationModel.deleteMany({ postId: id });

		return reply.status(200).send({ message: 'Post deleted' });
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send(error);
	}
};

/**
	@desc Like post
	@route PUT /api/v1/posts/:id
	@access Private
**/
export const likePost = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const { id } = request.params;

		const post = await PostModel.findById(id);

		if (!post) {
			return reply.status(404).send({ message: 'Post not found' });
		}

		const isAlreadyLiked = post.likes.some((like) => String(like) === request.user.id);

		if (!isAlreadyLiked) {
			post.likes.push(request.user.id);

			const postUserId = String(post.user);
			const isOwnPost = postUserId === request.user.id;

			if (!isOwnPost) {
				const notificationBody = {
					userId: postUserId,
					type: NotificationType.LIKE,
					actor: {
						id: request.user.id,
						username: request.user.username,
						photo: request.user.photo || null
					},
					post: {
						id: post.id,
						photo: post.photo
					}
				} satisfies CreateNotificationBody;

				createNotification(notificationBody).catch((error) => {
					request.log.error('Failed to create notification:', error);
				});
			}
		} else {
			post.likes = post.likes.filter((like) => String(like) !== request.user.id);
		}

		await post.save();
		await post.populate('user', POST_USER_PROJECTION);

		return reply.status(200).send(post);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send(error);
	}
};
