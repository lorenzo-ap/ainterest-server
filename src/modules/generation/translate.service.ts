import { getRapidAPIHeaders } from '../../utils/utils';

export const translateText = async (text: string): Promise<string> => {
	const host = 'ai-translate.p.rapidapi.com';
	const headers = getRapidAPIHeaders(host);
	const body = {
		texts: [text],
		tls: ['en'],
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
