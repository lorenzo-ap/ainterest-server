import type { z } from 'zod';
import type { RouteWithBody } from '../../types';
import type { createPostSchema } from './posts.schemas';

export type CreatePostBody = z.infer<typeof createPostSchema.body>;
export type CreatePostRoute = RouteWithBody<CreatePostBody>;
