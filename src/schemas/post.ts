import { BASE64_IMAGE_DATA_URL_REGEX } from '../constants';

export const createPostSchema = {
	body: {
		type: 'object',
		required: ['prompt', 'photo'],
		properties: {
			prompt: { type: 'string', minLength: 5, maxLength: 200 },
			photo: {
				type: 'string',
				pattern: BASE64_IMAGE_DATA_URL_REGEX,
				minLength: 100,
				maxLength: 5000000
			}
		}
	}
} as const;
