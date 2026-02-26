import { z } from 'zod';
import { BASE64_IMAGE_DATA_URL_REGEX } from '../constants';

export const editUserSchema = {
	body: z.object({
		username: z.string().optional(),
		email: z.email().optional(),
		photo: z.string().min(100).max(1500000).regex(BASE64_IMAGE_DATA_URL_REGEX).optional()
	})
};
