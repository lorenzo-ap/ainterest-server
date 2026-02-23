import { v2 as cloudinary } from 'cloudinary';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotificationModel, PostModel } from '../models';
import { type CreatePostRoute, type IdParam, NotificationType } from '../types';
import { createNotification } from './notification';

/**
	@desc Get all posts
	@route GET /api/v1/posts
	@access Public
**/
export const getPosts = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const posts = await PostModel.find({});

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

		const posts = await PostModel.find({ 'user._id': id });

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
		const { _id, username, email, photo: userPhoto } = request.user;

		const cloudinaryPhoto = await cloudinary.uploader.upload(photo);
		const newPost = await PostModel.create({
			user: {
				_id,
				username,
				email,
				photo: userPhoto
			},
			prompt,
			photo: cloudinaryPhoto.secure_url
		});

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

		const isOwner = post.user._id.toString() === request.user._id.toString();
		if (!isOwner) {
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

		const isAlreadyLiked = post.likes.includes(request.user._id);

		if (!isAlreadyLiked) {
			post.likes.push(request.user._id);

			const isOwnPost = post.user._id.toString() === request.user._id.toString();
			if (!isOwnPost) {
				createNotification({
					userId: post.user._id.toString(),
					actorId: request.user._id.toString(),
					actorUsername: request.user.username,
					actorPhoto: request.user.photo,
					type: NotificationType.LIKE,
					postId: post._id.toString(),
					postPhoto: post.photo
				}).catch((error) => {
					request.log.error('Failed to create notification:', error);
				});
			}
		} else {
			post.likes = post.likes.filter((like) => like.toString() !== request.user._id.toString());
		}

		await post.save();

		return reply.status(200).send(post);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send(error);
	}
};
