import { Types } from 'mongoose';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { serializeMongo } from '../src/serializers/mongo';
import { getEnvNumber, getEnvString, isObjectLike } from '../src/utils/utils';

describe('getEnvString', () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('should return the value of an existing env variable', () => {
		process.env.TEST_STRING_VAR = 'hello';
		expect(getEnvString('TEST_STRING_VAR')).toBe('hello');
	});

	it('should throw when the env variable is not set', () => {
		delete process.env.MISSING_VAR;
		expect(() => getEnvString('MISSING_VAR')).toThrow('Missing env var: MISSING_VAR');
	});
});

describe('getEnvNumber', () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('should return the numeric value of an existing env variable', () => {
		process.env.TEST_NUM_VAR = '42';
		expect(getEnvNumber('TEST_NUM_VAR')).toBe(42);
	});

	it('should throw when the env variable is not set', () => {
		delete process.env.MISSING_NUM_VAR;
		expect(() => getEnvNumber('MISSING_NUM_VAR')).toThrow('Missing env var: MISSING_NUM_VAR');
	});

	it('should throw when the env variable is not a valid number', () => {
		process.env.BAD_NUM_VAR = 'not-a-number';
		expect(() => getEnvNumber('BAD_NUM_VAR')).toThrow('Invalid number in env var: BAD_NUM_VAR');
	});
});

describe('isObjectLike', () => {
	it('should return true for plain objects', () => {
		expect(isObjectLike({ key: 'value' })).toBe(true);
	});

	it('should return true for arrays', () => {
		expect(isObjectLike([1, 2, 3])).toBe(true);
	});

	it('should return false for null', () => {
		expect(isObjectLike(null)).toBe(false);
	});

	it('should return false for strings', () => {
		expect(isObjectLike('string')).toBe(false);
	});

	it('should return false for numbers', () => {
		expect(isObjectLike(42)).toBe(false);
	});

	it('should return false for undefined', () => {
		expect(isObjectLike(undefined)).toBe(false);
	});
});

describe('serializeMongo', () => {
	it('should convert ObjectId to a string', () => {
		const id = new Types.ObjectId();
		expect(serializeMongo(id)).toBe(id.toString());
	});

	it('should rename _id to id in plain objects', () => {
		const id = new Types.ObjectId();
		const result = serializeMongo({ _id: id, name: 'test' }) as Record<string, unknown>;
		expect(result.id).toBe(id.toString());
		expect(result._id).toBeUndefined();
	});

	it('should strip the __v field', () => {
		const result = serializeMongo({ _id: new Types.ObjectId(), __v: 0, name: 'test' }) as Record<string, unknown>;
		expect(result.__v).toBeUndefined();
	});

	it('should strip the updatedAt field', () => {
		const result = serializeMongo({ name: 'test', updatedAt: new Date() }) as Record<string, unknown>;
		expect(result.updatedAt).toBeUndefined();
	});

	it('should recursively serialize arrays', () => {
		const ids = [new Types.ObjectId(), new Types.ObjectId()];
		const result = serializeMongo(ids) as string[];
		expect(result).toEqual(ids.map((id) => id.toString()));
	});

	it('should recursively serialize nested objects', () => {
		const id = new Types.ObjectId();
		const result = serializeMongo({ user: { _id: id, name: 'alice' } }) as Record<string, Record<string, unknown>>;
		expect(result.user.id).toBe(id.toString());
		expect(result.user._id).toBeUndefined();
	});

	it('should pass through Date values unchanged', () => {
		const date = new Date('2024-01-01');
		expect(serializeMongo(date)).toEqual(date);
	});

	it('should pass through primitive values unchanged', () => {
		expect(serializeMongo('hello')).toBe('hello');
		expect(serializeMongo(42)).toBe(42);
		expect(serializeMongo(true)).toBe(true);
		expect(serializeMongo(null)).toBeNull();
	});

	it('should call toObject() on Mongoose documents before serializing', () => {
		const id = new Types.ObjectId();
		const mockDoc = {
			toObject: () => ({ _id: id, name: 'doc', __v: 0 })
		};
		const result = serializeMongo(mockDoc) as Record<string, unknown>;
		expect(result.id).toBe(id.toString());
		expect(result.name).toBe('doc');
		expect(result.__v).toBeUndefined();
	});
});
