import { v2 as cloudinary } from 'cloudinary';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { PostModel, UserModel } from '../models';
import type { EditUserRoute, UsernameParam } from '../types';

/**
	@desc Get user data
	@route GET /api/v1/users/current
	@access Private
**/
export const currentUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const { _id, username, email, photo, role } = request.user;

	return reply.status(200).send({
		_id,
		username,
		email,
		photo,
		role
	});
};

/**
	@desc Get user data by username
	@route GET /api/v1/users/:username
	@access Private
**/
export const getUserByUsername = async (request: FastifyRequest<UsernameParam>, reply: FastifyReply) => {
	const username = request.params.username;

	const user = await UserModel.findOne({ username });

	if (!user) {
		return reply.status(400).send({ message: 'User not found' });
	}

	return reply.status(200).send({
		_id: user._id,
		username: user.username,
		email: user.email,
		photo: user.photo,
		role: user.role
	});
};

/**
 * @desc Edit user data
 * @route PUT /api/v1/users/edit
 * @access Private
 */
export const editUser = async (request: FastifyRequest<EditUserRoute>, reply: FastifyReply) => {
	const { username, email, photo } = request.body;

	const user = await UserModel.findById(request.user._id);

	if (!user) {
		return reply.status(400).send({ message: 'User not found' });
	}

	if (username) user.username = username;
	if (email) user.email = email;
	if (photo) {
		const cloudinaryPhoto = await cloudinary.uploader.upload(photo, {
			folder: 'users',
			width: 150,
			crop: 'scale'
		});
		user.photo = cloudinaryPhoto.secure_url;
	}

	await user.save();

	await PostModel.updateMany(
		{ 'user._id': user._id },
		{
			'user.username': user.username,
			'user.email': user.email,
			'user.photo': user.photo
		}
	);

	return reply.status(200).send({
		_id: user._id,
		username: user.username,
		email: user.email,
		photo: user.photo,
		role: user.role
	});
};
