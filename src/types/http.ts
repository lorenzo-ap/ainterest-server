import type { z } from 'zod';
import type { idParamSchema, usernameParamSchema } from '../schemas';

export type RouteWithBody<T> = {
	Body: T;
};

export type RouteWithParams<T> = {
	Params: T;
};

export type IdParam = RouteWithParams<z.infer<typeof idParamSchema.params>>;
export type UsernameParam = RouteWithParams<z.infer<typeof usernameParamSchema.params>>;
