import { MongoDBContainer, type StartedMongoDBContainer } from '@testcontainers/mongodb';

let container: StartedMongoDBContainer;

export async function setup(): Promise<void> {
	container = await new MongoDBContainer('mongo:7').start();

	process.env.MONGODB_URL = `${container.getConnectionString()}?directConnection=true`;
	process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-jwt-signing';
	process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-jwt-signing';
	process.env.JWT_RESET_SECRET = 'test-reset-secret-for-jwt-signing';
	process.env.FRONTEND_URL = 'http://localhost:3000';
	process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
	process.env.CLOUDINARY_API_KEY = 'test-api-key';
	process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
	process.env.RAPIDAPI_KEY = 'test-rapidapi-key';
	process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
	process.env.RESEND_API_KEY = 're_test_key';
	process.env.EMAIL_FROM = 'test@example.com';
	process.env.EMAIL_FROM_NAME = 'Test App';
	process.env.CLOUDFLARE_ACCOUNT_ID = 'test-cf-account';
	process.env.CLOUDFLARE_API_TOKEN = 'test-cf-token';
	process.env.IMAGE_GENERATOR_NUM_STEPS = '1';
}

export async function teardown(): Promise<void> {
	await container.stop();
}
