// at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character

import { PASSWORD_REGEX } from '../constants';

export const loginSchema = {
	body: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: { type: 'string', format: 'email' },
			password: { type: 'string', pattern: PASSWORD_REGEX }
		}
	}
} as const;

export const registerSchema = {
	body: {
		type: 'object',
		required: ['username', 'email', 'password'],
		properties: {
			username: { type: 'string', minLength: 3, maxLength: 20 },
			email: { type: 'string', format: 'email' },
			password: { type: 'string', pattern: PASSWORD_REGEX }
		}
	}
} as const;

export const googleAuthSchema = {
	body: {
		type: 'object',
		required: ['credential'],
		properties: {
			credential: { type: 'string', minLength: 1 }
		}
	}
} as const;

export const forgotPasswordSchema = {
	body: {
		type: 'object',
		required: ['email'],
		properties: {
			email: { type: 'string', format: 'email' }
		}
	}
} as const;

export const resetPasswordSchema = {
	body: {
		type: 'object',
		required: ['token', 'password'],
		properties: {
			token: { type: 'string', minLength: 1 },
			password: { type: 'string', pattern: PASSWORD_REGEX }
		}
	}
} as const;
