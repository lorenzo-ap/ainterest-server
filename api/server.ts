import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

if (!process.env.VERCEL) {
	const start = async () => {
		const app = await buildApp();
		const port = 9999;

		try {
			await app.listen({ port });
		} catch (err) {
			app.log.error(err);
			process.exit(1);
		}
	};

	start();
}

let appInstance: FastifyInstance | undefined;

export default async function (req: IncomingMessage, res: ServerResponse) {
	if (!appInstance) {
		appInstance = await buildApp();
		await appInstance.ready();
	}
	appInstance.server.emit('request', req, res);
}
