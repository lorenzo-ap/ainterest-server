import type { z } from 'zod';
import type { RouteWithBody, RouteWithParams } from '../../types';
import type {
	passkeyAuthenticationOptionsSchema,
	passkeyAuthenticationVerifySchema,
	passkeyRegistrationOptionsSchema,
	passkeyRegistrationVerifySchema,
	passkeyRevokeSchema
} from './passkeys.schemas';

export type PasskeyRegistrationOptionsBody = z.infer<typeof passkeyRegistrationOptionsSchema.body>;
export type PasskeyRegistrationVerifyBody = z.infer<typeof passkeyRegistrationVerifySchema.body>;
export type PasskeyAuthenticationOptionsBody = z.infer<typeof passkeyAuthenticationOptionsSchema.body>;
export type PasskeyAuthenticationVerifyBody = z.infer<typeof passkeyAuthenticationVerifySchema.body>;
export type PasskeyRevokeParams = z.infer<typeof passkeyRevokeSchema.params>;

export type PasskeyRegistrationOptionsRoute = RouteWithBody<PasskeyRegistrationOptionsBody>;
export type PasskeyRegistrationVerifyRoute = RouteWithBody<PasskeyRegistrationVerifyBody>;
export type PasskeyAuthenticationOptionsRoute = RouteWithBody<PasskeyAuthenticationOptionsBody>;
export type PasskeyAuthenticationVerifyRoute = RouteWithBody<PasskeyAuthenticationVerifyBody>;
export type PasskeyRevokeRoute = RouteWithParams<PasskeyRevokeParams>;
