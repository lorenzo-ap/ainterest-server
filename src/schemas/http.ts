import { z } from 'zod';
import { MONGO_ID_REGEX } from '../constants';

export const idParamSchema = {
	params: z.object({
		id: z.string().regex(MONGO_ID_REGEX)
	})
};

export const usernameParamSchema = {
	params: z.object({
		username: z.string().min(3).max(20)
	})
};
