import { z } from 'zod';

export const generateImageSchema = {
	body: z.object({
		text: z.string().min(5).max(200),
		size: z.union([z.literal(256), z.literal(512), z.literal(1024)]).optional()
	})
};
