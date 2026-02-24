import { buildApp } from '../src/app';

const start = async () => {
	const app = await buildApp();
	const port = 9999;

	try {
		await app.listen({ port });
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
