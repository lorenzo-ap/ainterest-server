import { v2 as cloudinary } from 'cloudinary';
import fastifyPlugin from 'fastify-plugin';

export const cloudinaryPlugin = fastifyPlugin(() => {
	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET
	});
});
