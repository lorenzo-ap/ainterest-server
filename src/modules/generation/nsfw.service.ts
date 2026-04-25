import { getRapidAPIHeaders } from '../../utils/utils';
import type { NSFWResult } from './generation.types';

export const checkNSFW = async (text: string): Promise<NSFWResult> => {
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
