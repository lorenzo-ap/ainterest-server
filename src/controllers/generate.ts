import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GenerateImageRoute, NSFWResult } from '../types';
import { getEnvNumber, getRapidAPIHeaders } from '../utils/utils';

const translateTextHelper = async (text: string, targetLanguage: string = 'en'): Promise<string> => {
	const host = 'ai-translate.p.rapidapi.com';
	const headers = getRapidAPIHeaders(host);
	const body = {
		texts: [text],
		tls: [targetLanguage],
		sl: 'auto'
	};

	const response = await fetch(`https://${host}/translates`, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		throw new Error(`Translation failed! status: ${response.status}`);
	}

	const data = await response.json();
	return data[0].texts[0];
};

const checkNSFWHelper = async (text: string): Promise<NSFWResult> => {
	const host = 'nsfw-text-detection.p.rapidapi.com';
	const headers = getRapidAPIHeaders(host);

	const response = await fetch(`https://${host}/nsfw?text=${encodeURIComponent(text)}`, {
		headers
	});

	if (!response.ok) {
		throw new Error(`NSFW check failed! status: ${response.status}`);
	}

	return await response.json();
};

const generateImageHelper = async (prompt: string, size: number = 512): Promise<string> => {
	const body = {
		prompt,
		negative_prompt: 'NSFW',
		width: size,
		height: size,
		num_steps: getEnvNumber('IMAGE_GENERATOR_NUM_STEPS')
	};

	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}
	);

	if (!response.ok) {
		throw new Error(`Image generation failed! status: ${response.status}`);
	}

	const imageBuffer = await response.arrayBuffer();
	const base64Image = Buffer.from(imageBuffer).toString('base64');

	return `data:image/png;base64,${base64Image}`;
};

/**
 * @desc Translate text, check for NSFW, and generate image
 * @route POST /api/v1/generate/image
 * @access Private
 */
export const generateImage = async (request: FastifyRequest<GenerateImageRoute>, reply: FastifyReply) => {
	try {
		const { text, targetLanguage = 'en', size = 512 } = request.body;

		if (!text) {
			return reply.status(400).send({ error: 'Text is required' });
		}

		const translatedText = await translateTextHelper(text, targetLanguage);
		const nsfwData = await checkNSFWHelper(translatedText);

		if (nsfwData.sexual_score > 0.3) {
			return reply.status(400).send({
				error: 'Content contains explicit or adult content, please try a different one',
				nsfw: true
			});
		}

		const image = await generateImageHelper(translatedText, size);

		return reply.status(200).send({
			originalText: text,
			translatedText,
			nsfwCheck: nsfwData,
			image
		});
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
