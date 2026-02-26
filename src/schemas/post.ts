import { z } from 'zod';
import { BASE64_IMAGE_DATA_URL_REGEX } from '../constants';

export const createPostSchema = {
	body: z.object({
		prompt: z.string().min(5).max(200),
		photo: z.string().min(100).max(5000000).regex(BASE64_IMAGE_DATA_URL_REGEX)
	})
};
