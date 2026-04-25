import type { z } from 'zod';
import type { RouteWithBody } from '../../types';
import type { editUserSchema } from './users.schemas';

export type EditUserBody = z.infer<typeof editUserSchema.body>;
export type EditUserRoute = RouteWithBody<EditUserBody>;
