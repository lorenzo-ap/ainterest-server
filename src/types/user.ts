import type { z } from 'zod';
import type { editUserSchema } from '../schemas';
import type { RouteWithBody } from './http';

export interface User {
	id: string;
	username: string;
	email: string;
	password: string;
	photo: string;
	role: 'user' | 'admin';
	resetPasswordToken?: string;
	resetPasswordExpires?: Date;
}

export type EditUserBody = z.infer<typeof editUserSchema.body>;

export type EditUserRoute = RouteWithBody<EditUserBody>;
