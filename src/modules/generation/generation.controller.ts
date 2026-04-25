import type { FastifyReply, FastifyRequest } from 'fastify';
import { runImageGenerationPipeline } from './generation.service';
import type { GenerateImageRoute } from './generation.types';

export const generateImage = async (request: FastifyRequest<GenerateImageRoute>, reply: FastifyReply) => {
	try {
		const { text, size = 512 } = request.body;
		const result = await runImageGenerationPipeline(text, size);

		return reply.status(result.status).send(result.body);
	} catch (error) {
		if (error instanceof Error) {
			request.log.error(`Error in pipeline: ${error.message}`);
			return reply.status(500).send({
				error: 'Internal server error',
				details: error.message
			});
		}

		return reply.status(500).send({
			error: 'Internal server error'
		});
	}
};
