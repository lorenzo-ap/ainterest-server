import { BASE64_IMAGE_DATA_URL_REGEX } from '../constants';

export const editUserSchema = {
	body: {
		type: 'object',
		properties: {
			username: { type: 'string' },
			email: { type: 'string', format: 'email' },
			photo: {
				type: 'string',
				pattern: BASE64_IMAGE_DATA_URL_REGEX,
				minLength: 100,
				maxLength: 1500000
			}
		}
	}
} as const;
