import { getEnvNumber, getEnvString } from '../../utils/utils';

export const generateImageFromPrompt = async (prompt: string, size: number = 512): Promise<string> => {
	const body = {
		prompt,
		negative_prompt: 'NSFW',
		width: size,
		height: size,
		num_steps: getEnvNumber('IMAGE_GENERATOR_NUM_STEPS')
	};

	const cloudflareAccountId = getEnvString('CLOUDFLARE_ACCOUNT_ID');
	const cloudflareApiToken = getEnvString('CLOUDFLARE_API_TOKEN');

	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${cloudflareApiToken}`,
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
