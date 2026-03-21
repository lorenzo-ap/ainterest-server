import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { buildApp } from '../../src/app';

export async function buildTestApp(): Promise<FastifyInstance> {
	const app = await buildApp();
	await app.ready();
	return app;
}

export async function clearDatabase(): Promise<void> {
	const { collections } = mongoose.connection;
	await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}

export function extractCookies(response: { headers: Record<string, string | string[]> }): string {
	const setCookie = response.headers['set-cookie'];
	if (!setCookie) return '';
	const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
	return cookieArray.map((c) => c.split(';')[0]).join('; ');
}
