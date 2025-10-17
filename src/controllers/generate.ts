import { FastifyReply, FastifyRequest } from 'fastify';
import { getRapidAPIHeaders } from '../utils/utils';

/**
 * Helper function to translate text to a target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (default: 'en')
 * @returns {Promise<string>} Translated text
 */
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

interface NSFWResult {
	sexual_score: number;
	[key: string]: any;
}

/**
 * Helper function to check if text contains NSFW content
 * @param {string} text - Text to check
 * @returns {Promise<object>} NSFW check result
 */
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

/**
 * Helper function to generate an image from a prompt
 * @param {string} prompt - Image generation prompt
 * @param {number} size - Image dimensions (width and height)
 * @returns {Promise<string>} Base64 encoded image
 */
const generateImageHelper = async (prompt: string, size: number = 512): Promise<string> => {
	const body = {
		prompt,
		negative_prompt: 'NSFW',
		width: size,
		height: size,
		num_steps: +process.env.IMAGE_GENERATOR_NUM_STEPS!
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

interface GenerateImageBody {
	text: string;
	targetLanguage?: string;
	size?: number;
}

/**
 * @desc Translate text, check for NSFW, and generate image
 * @route POST /api/v1/generate/image
 * @access Private
 */
export const generateImage = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const { text, targetLanguage = 'en', size = 512 } = request.body as GenerateImageBody;

		if (!text) {
			return reply.status(400).send({ error: 'Text is required' });
		}

		// Step 1: Translate text
		const translatedText = await translateTextHelper(text, targetLanguage);

		// Step 2: Check for NSFW content
		const nsfwData = await checkNSFWHelper(translatedText);

		// If content is NSFW, return error
		if (nsfwData.sexual_score > 0.3) {
			return reply.status(400).send({
				error: 'Content contains explicit or adult content, please try a different one',
				nsfw: true
			});
		}

		// Step 3: Generate image
		const image = await generateImageHelper(translatedText, size);

		return reply.status(200).send({
			originalText: text,
			translatedText,
			nsfwCheck: nsfwData,
			image
		});
	} catch (error: any) {
		request.log.error('Error in pipeline:', error.message);
		return reply.status(500).send({ error: 'Internal server error', details: error.message });
	}
};
