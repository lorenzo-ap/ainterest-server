import { v2 as cloudinary } from 'cloudinary';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { Post, User } from '../models';
import { EditUserBody } from '../types';

/**
	@desc Get user data
	@route GET /api/v1/users/current
	@access Private
**/
export const currentUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const authenticatedRequest = request as AuthenticatedRequest;
	const { _id, username, email, photo, role } = authenticatedRequest.user;

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
export const getUserByUsername = async (
	request: FastifyRequest<{ Params: { username: string } }>,
	reply: FastifyReply
) => {
	const user = await User.findOne({ username: request.params.username });

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
export const editUser = async (request: FastifyRequest, reply: FastifyReply) => {
	const authenticatedRequest = request as AuthenticatedRequest;
	const { username, email, photo } = authenticatedRequest.body as EditUserBody;

	const user = await User.findById(authenticatedRequest.user._id);

	if (!user) {
		return reply.status(400).send({ message: 'User not found' });
	}

	// Update user fields
	if (username) user.username = username;
	if (email) user.email = email;

	if (photo) {
		const cloudinaryPhoto = await cloudinary.uploader.upload(`data:image/jpeg;base64,${photo}`, {
			folder: 'users',
			width: 150,
			crop: 'scale'
		});

		user.photo = cloudinaryPhoto.secure_url;
	}

	await user.save();

	await Post.updateMany(
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
