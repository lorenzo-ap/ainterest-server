import { v2 as cloudinary } from 'cloudinary';
import { UserModel } from './user.model';
import type { EditUserBody } from './users.types';

export const toUserResponse = (user: {
	id: string;
	username: string;
	email: string;
	photo?: string;
	role: string;
}) => ({
	id: user.id,
	username: user.username,
	email: user.email,
	photo: user.photo || null,
	role: user.role
});

export const findUserByUsername = async (username: string) => UserModel.findOne({ username });

export const updateUser = async (userId: string, body: EditUserBody) => {
	const { username, email, photo } = body;
	const user = await UserModel.findById(userId);

	if (!user) {
		return null;
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

	return user;
};
