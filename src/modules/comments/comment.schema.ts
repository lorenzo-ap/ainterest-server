import { z } from 'zod';

export const createCommentSchema = {
	body: z.object({
		text: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long')
	})
};
