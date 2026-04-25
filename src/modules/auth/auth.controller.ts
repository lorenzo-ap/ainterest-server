import type { FastifyReply, FastifyRequest } from 'fastify';
import { authenticateWithGoogle, login, logout, logoutAll, register, rotateRefreshToken } from './auth.service';
import type { ForgotPasswordRoute, GoogleAuthRoute, LoginRoute, RegisterRoute, ResetPasswordRoute } from './auth.types';
import { requestPasswordReset, resetUserPassword } from './password-reset.service';

export const registerUser = async (request: FastifyRequest<RegisterRoute>, reply: FastifyReply) => {
	const result = await register(request.body, reply);
	return reply.status(result.status).send(result.body);
};

export const loginUser = async (request: FastifyRequest<LoginRoute>, reply: FastifyReply) => {
	const result = await login(request.body, reply);
	return reply.status(result.status).send(result.body);
};

export const googleAuth = async (request: FastifyRequest<GoogleAuthRoute>, reply: FastifyReply) => {
	try {
		const result = await authenticateWithGoogle(request.body, reply);
		return reply.status(result.status).send(result.body);
	} catch (error) {
		request.log.error(error);
		return reply.status(400).send({ message: 'Invalid Google credential' });
	}
};

export const refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const result = await rotateRefreshToken(request.cookies['refresh-token'], reply);
		return reply.status(result.status).send(result.body);
	} catch (error) {
		request.log.error(error);
		return reply.status(403).send({ message: 'Your session has expired, please sign in again' });
	}
};

export const logoutUser = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const body = await logout(request.user.id, request.cookies['refresh-token'], reply);
		return reply.status(200).send(body);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Server error' });
	}
};

export const logoutAllDevices = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const body = await logoutAll(request.user.id, reply);
		return reply.status(200).send(body);
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Server error' });
	}
};

export const forgotPassword = async (request: FastifyRequest<ForgotPasswordRoute>, reply: FastifyReply) => {
	try {
		await requestPasswordReset(request.body.email);

		return reply.status(200).send({
			message: 'If an account exists with that email, a password reset link has been sent'
		});
	} catch (error) {
		request.log.error(error);
		return reply.status(500).send({ message: 'Server error' });
	}
};

export const resetPassword = async (request: FastifyRequest<ResetPasswordRoute>, reply: FastifyReply) => {
	try {
		const reset = await resetUserPassword(request.body.token, request.body.password);

		if (!reset) {
			return reply.status(400).send({ message: 'Invalid or expired reset token' });
		}

		return reply.status(200).send({ message: 'Password reset successfully' });
	} catch (error) {
		request.log.error(error);
		return reply.status(400).send({ message: 'Invalid or expired reset token' });
	}
};
