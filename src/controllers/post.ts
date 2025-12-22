import { v2 as cloudinary } from 'cloudinary';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { Notification, Post } from '../models';
import { CreatePostBody, NotificationType } from '../types';
import { createNotification } from './notification';

/**
	@desc Get all posts
	@route GET /api/v1/posts
	@access Public
**/
export const getPosts = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const posts = await Post.find({});

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
export const getUserPosts = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	try {
		const { id } = request.params;

		const posts = await Post.find({ 'user._id': id });

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
export const createPost = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const authenticatedRequest = request as AuthenticatedRequest;
		const { prompt, photo } = authenticatedRequest.body as CreatePostBody;
		const { _id, username, email, photo: userPhoto } = authenticatedRequest.user;

		const cloudinaryPhoto = await cloudinary.uploader.upload(photo);
		const newPost = await Post.create({
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
export const deletePost = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const { id } = request.params as { id: string };

		await Post.findByIdAndDelete(id);
		await Notification.deleteMany({ postId: id });

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
export const likePost = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const authenticatedRequest = request as AuthenticatedRequest;
		const { id } = authenticatedRequest.params as { id: string };

		const post = await Post.findById(id);

		if (!post) {
			return reply.status(404).send({ message: 'Post not found' });
		}

		const isAlreadyLiked = post.likes.includes(authenticatedRequest.user._id);

		if (!isAlreadyLiked) {
			post.likes.push(authenticatedRequest.user._id);

			const isOwnPost = post.user._id.toString() === authenticatedRequest.user._id.toString();
			if (!isOwnPost) {
				createNotification({
					userId: post.user._id.toString(),
					actorId: authenticatedRequest.user._id.toString(),
					actorUsername: authenticatedRequest.user.username,
					actorPhoto: authenticatedRequest.user.photo,
					type: NotificationType.LIKE,
					postId: post._id.toString(),
					postPhoto: post.photo
				}).catch((error) => {
					request.log.error('Failed to create notification:', error);
				});
			}
		} else {
			post.likes = post.likes.filter((like) => like.toString() !== authenticatedRequest.user._id.toString());
		}

		await post.save();

		return reply.status(200).send(post);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send(error);
	}
};
