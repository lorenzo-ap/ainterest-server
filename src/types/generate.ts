import type { z } from 'zod';
import type { generateImageSchema } from '../schemas';
import type { RouteWithBody } from './http';

export interface NSFWResult {
	flagged: boolean;
	sexual: boolean;
	sexual_score: number;
}

export type GenerateImageBody = z.infer<typeof generateImageSchema.body>;

export type GenerateImageRoute = RouteWithBody<GenerateImageBody>;
