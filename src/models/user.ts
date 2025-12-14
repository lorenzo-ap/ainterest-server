import { Schema, Types, model } from 'mongoose';

export interface IUser {
	_id: Types.ObjectId;
	username: string;
	email: string;
	password: string;
	photo: string;
	role: 'user' | 'admin';
}

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
	}
});

export const User = model<IUser>('User', userSchema);
