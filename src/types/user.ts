import type { ObjectId } from 'mongoose';
import type { RouteWithBody } from './http';

export interface User {
	_id: ObjectId;
	username: string;
	email: string;
	password: string;
	photo: string;
	role: 'user' | 'admin';
	resetPasswordToken?: string;
	resetPasswordExpires?: Date;
}

export interface EditUserBody {
	username: string;
	email: string;
	photo: string;
}

export type EditUserRoute = RouteWithBody<Partial<EditUserBody>>;
