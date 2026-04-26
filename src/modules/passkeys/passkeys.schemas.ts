import { z } from 'zod';

export const passkeyRegistrationOptionsSchema = {
	body: z.object({
		password: z.string().min(1)
	})
};

export const passkeyRegistrationVerifySchema = {
	body: z.object({
		name: z.string().min(1),
		credential: z.record(z.string(), z.unknown())
	})
};

export const passkeyAuthenticationOptionsSchema = {
	body: z.object({
		email: z.email()
	})
};

export const passkeyAuthenticationVerifySchema = {
	body: z.object({
		email: z.email(),
		credential: z.record(z.string(), z.unknown())
	})
};

export const passkeyRevokeSchema = {
	params: z.object({
		credentialId: z.string().min(1)
	})
};
