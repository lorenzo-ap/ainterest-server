export const getRapidAPIHeaders = (host: string): Record<string, string> => {
	return {
		'x-rapidapi-key': getEnvString('RAPIDAPI_KEY'),
		'x-rapidapi-host': host,
		'Content-Type': 'application/json'
	};
};

export const getEnvNumber = (key: string): number => {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing env var: ${key}`);
	}

	const parsed = Number(value);
	if (Number.isNaN(parsed)) {
		throw new Error(`Invalid number in env var: ${key}`);
	}

	return parsed;
};

export const getEnvString = (key: string): string => {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing env var: ${key}`);
	}
	return value;
};

export const isObjectLike = (value: unknown): value is Record<string, unknown> => {
	return value !== null && typeof value === 'object';
};
