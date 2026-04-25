import type { z } from 'zod';
import type { RouteWithBody } from '../../types';
import type { generateImageSchema } from './generation.schemas';

export interface NSFWResult {
	flagged: boolean;
	sexual: boolean;
	sexual_score: number;
}

export type GenerateImageBody = z.infer<typeof generateImageSchema.body>;
export type GenerateImageRoute = RouteWithBody<GenerateImageBody>;
