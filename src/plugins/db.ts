import fastifyPlugin from 'fastify-plugin';
import mongoose from 'mongoose';

export const dbPlugin = fastifyPlugin(async (app) => {
	const mongodbURL = process.env.MONGODB_URL;

	if (!mongodbURL) {
		throw new Error('MONGODB_URL is not defined');
	}

	mongoose.set('strictQuery', true);
	await mongoose.connect(mongodbURL);

	app.log.info('MongoDB connected');
	app.addHook('onClose', async () => {
		await mongoose.disconnect();
	});
});
