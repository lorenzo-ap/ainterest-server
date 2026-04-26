import type { FastifyInstance } from 'fastify';
import { protect } from '../../hooks';
import {
	getAuthenticationOptions,
	getPasskeys,
	getRegistrationOptions,
	removePasskey,
	verifyAuthenticationResponse,
	verifyRegistrationResponse
} from './passkeys.controller';
import {
	passkeyAuthenticationOptionsSchema,
	passkeyAuthenticationVerifySchema,
	passkeyRegistrationOptionsSchema,
	passkeyRegistrationVerifySchema,
	passkeyRevokeSchema
} from './passkeys.schemas';
import type {
	PasskeyAuthenticationOptionsRoute,
	PasskeyAuthenticationVerifyRoute,
	PasskeyRegistrationOptionsRoute,
	PasskeyRegistrationVerifyRoute,
	PasskeyRevokeRoute
} from './passkeys.types';

export async function passkeyRoutes(server: FastifyInstance) {
	server.post<PasskeyRegistrationOptionsRoute>(
		'/registration/options',
		{ schema: passkeyRegistrationOptionsSchema, preHandler: protect },
		getRegistrationOptions
	);
	server.post<PasskeyRegistrationVerifyRoute>(
		'/registration/verify',
		{ schema: passkeyRegistrationVerifySchema, preHandler: protect },
		verifyRegistrationResponse
	);

	server.post<PasskeyAuthenticationOptionsRoute>(
		'/authentication/options',
		{ schema: passkeyAuthenticationOptionsSchema },
		getAuthenticationOptions
	);
	server.post<PasskeyAuthenticationVerifyRoute>(
		'/authentication/verify',
		{ schema: passkeyAuthenticationVerifySchema },
		verifyAuthenticationResponse
	);

	server.get('/', { preHandler: protect }, getPasskeys);
	server.delete<PasskeyRevokeRoute>(
		'/:credentialId',
		{ schema: passkeyRevokeSchema, preHandler: protect },
		removePasskey
	);
}
