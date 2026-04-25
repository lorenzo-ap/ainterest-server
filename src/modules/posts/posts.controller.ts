import type { FastifyReply, FastifyRequest } from 'fastify';
import type { IdParam } from '../../types';
import { createUserPost, deleteUserPost, listPosts, listUserPosts, togglePostLike } from './posts.service';
import type { CreatePostRoute } from './posts.types';

export const getPosts = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const posts = await listPosts(request.user?.id);
		return reply.status(200).send(posts);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error fetching posts' });
	}
};

export const getUserPosts = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const posts = await listUserPosts(request.params.id, request.user?.id);
		return reply.status(200).send(posts);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error fetching user posts' });
	}
};

export const createPost = async (request: FastifyRequest<CreatePostRoute>, reply: FastifyReply) => {
	try {
		const newPost = await createUserPost(request.user.id, request.body);
		return reply.status(201).send(newPost);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error creating post' });
	}
};

export const deletePost = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const result = await deleteUserPost(request.params.id, request.user.id, request.user.role);
		return reply.status(result.status).send(result.body);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error deleting post' });
	}
};

export const likePost = async (request: FastifyRequest<IdParam>, reply: FastifyReply) => {
	try {
		const result = await togglePostLike(request.params.id, request.user.id);
		return reply.status(result.status).send(result.body);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Error updating post reaction' });
	}
};
