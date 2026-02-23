import { Types } from 'mongoose';
import { isObjectLike } from '../utils/utils';

export const serializeMongo = <T>(value: T): T => {
	if (Array.isArray(value)) {
		return value.map((item) => serializeMongo(item)) as T;
	}

	if (value instanceof Types.ObjectId) {
		return value.toString() as T;
	}

	if (value instanceof Date || !isObjectLike(value)) {
		return value;
	}

	if ('toObject' in value && typeof value.toObject === 'function') {
		return serializeMongo(value.toObject()) as T;
	}

	const result: Record<string, unknown> = {};

	for (const [key, nestedValue] of Object.entries(value)) {
		if (key === '__v' || key === 'updatedAt') {
			continue;
		}

		const outputKey = key === '_id' ? 'id' : key;
		result[outputKey] = serializeMongo(nestedValue);
	}

	return result as T;
};
