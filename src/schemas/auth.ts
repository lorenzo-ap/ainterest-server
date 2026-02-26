import { z } from 'zod';
import { PASSWORD_REGEX } from '../constants';

export const loginSchema = {
	body: z.object({
		email: z.email(),
		password: z.string().regex(PASSWORD_REGEX)
	})
};

export const registerSchema = {
	body: z.object({
		username: z.string().min(3).max(20),
		email: z.email(),
		password: z.string().regex(PASSWORD_REGEX)
	})
};

export const googleAuthSchema = {
	body: z.object({
		credential: z.string().min(1)
	})
};

export const forgotPasswordSchema = {
	body: z.object({
		email: z.email()
	})
};

export const resetPasswordSchema = {
	body: z.object({
		token: z.string().min(1),
		password: z.string().regex(PASSWORD_REGEX)
	})
};
