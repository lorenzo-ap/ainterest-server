import { generateImageFromPrompt } from './image-generation.service';
import { checkNSFW } from './nsfw.service';
import { translateText } from './translate.service';

export const runImageGenerationPipeline = async (text: string, size: number = 512) => {
	const translatedText = await translateText(text);
	const nsfwData = await checkNSFW(translatedText);

	if (nsfwData.sexual_score > 0.3) {
		return {
			status: 400,
			body: {
				error: 'Content contains explicit or adult content, please try a different one',
				nsfw: true
			}
		};
	}

	const image = await generateImageFromPrompt(translatedText, size);

	return {
		status: 200,
		body: {
			originalText: text,
			translatedText,
			nsfwCheck: nsfwData,
			image
		}
	};
};
