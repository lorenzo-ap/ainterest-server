import { v2 as cloudinary } from 'cloudinary';
import fastifyPlugin from 'fastify-plugin';
import { getEnvString } from '../utils/utils';

export const cloudinaryPlugin = fastifyPlugin(() => {
	const cloudName = getEnvString('CLOUDINARY_CLOUD_NAME');
	const apiKey = getEnvString('CLOUDINARY_API_KEY');
	const apiSecret = getEnvString('CLOUDINARY_API_SECRET');

	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret
	});
});
