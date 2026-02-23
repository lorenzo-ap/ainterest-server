import type { ObjectId } from 'mongoose';
import type { RouteWithBody } from './http';

export interface RefreshToken {
	_id: ObjectId;
	userId: ObjectId;
	token: string;
	expiresAt: Date;
	createdAt: Date;
	isExpired(): boolean;
}

export interface LoginBody {
	email: string;
	password: string;
}

export interface RegisterBody extends LoginBody {
	username: string;
}

export interface GoogleAuthBody {
	credential: string;
}

export interface ForgotPasswordBody {
	email: string;
}

export interface ResetPasswordBody {
	token: string;
	password: string;
}

export type LoginRoute = RouteWithBody<LoginBody>;
export type RegisterRoute = RouteWithBody<RegisterBody>;
export type GoogleAuthRoute = RouteWithBody<GoogleAuthBody>;
export type ForgotPasswordRoute = RouteWithBody<ForgotPasswordBody>;
export type ResetPasswordRoute = RouteWithBody<ResetPasswordBody>;
