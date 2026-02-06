import { Resend } from 'resend';
import { passwordResetEmail } from '../assets/emails';
import type { SendEmailBody, SendEmailOptions } from '../types';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options: SendEmailOptions) => {
	const body: SendEmailBody = {
		from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
		to: options.to,
		subject: options.subject,
		html: options.html
	};

	resend.emails.send(body);
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
	const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
	const html = passwordResetEmail(resetUrl);

	sendEmail({
		to: email,
		subject: 'Password reset',
		html
	});
};
