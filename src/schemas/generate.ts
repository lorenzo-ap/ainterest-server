export const generateImageSchema = {
	body: {
		type: 'object',
		required: ['text'],
		properties: {
			text: { type: 'string', minLength: 5, maxLength: 200 },
			size: { type: 'number', enum: [256, 512, 1024] }
		}
	}
} as const;
