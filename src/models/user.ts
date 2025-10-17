import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
	_id: mongoose.Types.ObjectId;
	username: string;
	email: string;
	password: string;
	photo: string;
	role: 'user' | 'admin';
	refreshToken: string | null;
}

const userSchema = new mongoose.Schema({
	username: { type: String, required: [true, 'Please add a username'], unique: true },
	email: { type: String, required: [true, 'Please add an email'], unique: true },
	password: { type: String, required: [true, 'Please add a password'] },
	photo: { type: String, default: '' },
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
	refreshToken: { type: String, default: null }
});

export const User = mongoose.model<IUser>('User', userSchema);
