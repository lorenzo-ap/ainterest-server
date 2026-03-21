import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globalSetup: './tests/globalSetup.ts',
		pool: 'forks',
		fileParallelism: false,
		hookTimeout: 30000,
		testTimeout: 30000,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/types/**', 'src/assets/**']
		}
	}
});
