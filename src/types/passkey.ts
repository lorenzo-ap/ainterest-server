export interface PasskeyCredential {
	id: string;
	userId: string;
	name: string;
	credentialId: string;
	publicKey: string;
	counter: number;
	transports: string[];
	backedUp: boolean;
	createdAt: Date;
	updatedAt: Date;
	lastUsedAt?: Date;
}

export interface PasskeyChallenge {
	id: string;
	challenge: string;
	type: 'registration' | 'authentication';
	userId?: string;
	email: string;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}
