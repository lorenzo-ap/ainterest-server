import { Resend } from 'resend';
import { passwordResetEmail } from '../assets/emails';
import type { SendEmailBody, SendEmailOptions } from '../types';
import { getEnvString } from '../utils/utils';

const resendApiKey = getEnvString('RESEND_API_KEY');
const resend = new Resend(resendApiKey);

const sendEmail = async (options: SendEmailOptions) => {
	const emailFromName = getEnvString('EMAIL_FROM_NAME');
	const emailFrom = getEnvString('EMAIL_FROM');

	const body: SendEmailBody = {
		from: `${emailFromName} <${emailFrom}>`,
		to: options.to,
		subject: options.subject,
		html: options.html
	};

	resend.emails.send(body);
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
	const frontendURL = getEnvString('FRONTEND_URL');
	const resetUrl = `${frontendURL}/reset-password/${resetToken}`;
	const html = passwordResetEmail(resetUrl);

	sendEmail({
		to: email,
		subject: 'Password reset',
		html
	});
};
