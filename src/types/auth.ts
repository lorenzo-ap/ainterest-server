import type { z } from 'zod';
import type {
	forgotPasswordSchema,
	googleAuthSchema,
	loginSchema,
	registerSchema,
	resetPasswordSchema
} from '../schemas';
import type { RouteWithBody } from './http';

export interface RefreshToken {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
	isExpired(): boolean;
}

export type LoginBody = z.infer<typeof loginSchema.body>;
export type RegisterBody = z.infer<typeof registerSchema.body>;
export type GoogleAuthBody = z.infer<typeof googleAuthSchema.body>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema.body>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema.body>;

export type LoginRoute = RouteWithBody<LoginBody>;
export type RegisterRoute = RouteWithBody<RegisterBody>;
export type GoogleAuthRoute = RouteWithBody<GoogleAuthBody>;
export type ForgotPasswordRoute = RouteWithBody<ForgotPasswordBody>;
export type ResetPasswordRoute = RouteWithBody<ResetPasswordBody>;
