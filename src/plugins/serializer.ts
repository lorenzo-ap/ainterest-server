import fastifyPlugin from 'fastify-plugin';
import { serializeMongo } from '../serializers';

export const serializerPlugin = fastifyPlugin((app) => {
	app.addHook('preSerialization', async (_request, reply, payload) => {
		if (reply.statusCode >= 200 && reply.statusCode < 300) {
			return serializeMongo(payload);
		}
		return payload;
	});
});
