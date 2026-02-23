import { model, Schema } from 'mongoose';
import type { User } from '../types';

const userSchema = new Schema({
	username: {
		type: String,
		required: [true, 'Please add a username'],
		unique: true
	},
	email: {
		type: String,
		required: [true, 'Please add an email'],
		unique: true
	},
	password: {
		type: String,
		required: [true, 'Please add a password']
	},
	photo: {
		type: String,
		default: ''
	},
	role: {
		type: String,
		enum: ['user', 'admin'],
		default: 'user'
	},
	resetPasswordToken: {
		type: String
	},
	resetPasswordExpires: {
		type: Date
	}
});

export const UserModel = model<User>('User', userSchema);
