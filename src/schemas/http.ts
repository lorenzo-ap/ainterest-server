import { MONGO_ID_REGEX } from '../constants';

export const idParamSchema = {
	params: {
		type: 'object',
		required: ['id'],
		properties: {
			id: {
				type: 'string',
				pattern: MONGO_ID_REGEX
			}
		}
	}
} as const;

export const usernameParamSchema = {
	params: {
		type: 'object',
		required: ['username'],
		properties: {
			username: { type: 'string', minLength: 3, maxLength: 20 }
		}
	}
} as const;
