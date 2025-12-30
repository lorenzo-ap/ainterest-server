export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
}

export interface SendEmailBody {
	from: string;
	to: string;
	subject: string;
	html: string;
}
