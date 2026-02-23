// at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
const PASSWORD_REGEX = '^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$';

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
