export interface NSFWResult {
	flagged: boolean;
	sexual: boolean;
	sexual_score: number;
}

export interface GenerateImageBody {
	text: string;
	targetLanguage?: string;
	size?: number;
}
