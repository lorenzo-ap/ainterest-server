import fastifyPlugin from 'fastify-plugin';
import mongoose from 'mongoose';
import { getEnvString } from '../utils/utils';

export const dbPlugin = fastifyPlugin(async (app) => {
	const mongodbURL = getEnvString('MONGODB_URL');

	mongoose.set('strictQuery', true);
	await mongoose.connect(mongodbURL);

	app.log.info('MongoDB connected');
	app.addHook('onClose', async () => {
		await mongoose.disconnect();
	});
});
