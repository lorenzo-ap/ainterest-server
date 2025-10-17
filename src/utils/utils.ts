export const getRapidAPIHeaders = (host: string): Record<string, string> => {
	return {
		'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
		'x-rapidapi-host': host,
		'Content-Type': 'application/json'
	};
};
