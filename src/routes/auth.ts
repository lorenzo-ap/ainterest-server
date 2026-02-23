import type { FastifyInstance } from 'fastify';
import {
	forgotPassword,
	googleAuth,
	loginUser,
	logoutAllDevices,
	logoutUser,
	refreshToken,
	registerUser,
	resetPassword
} from '../controllers/auth';
import { protect } from '../hooks';
import { forgotPasswordSchema, googleAuthSchema, loginSchema, registerSchema, resetPasswordSchema } from '../schemas';
import type { ForgotPasswordRoute, GoogleAuthRoute, LoginRoute, RegisterRoute, ResetPasswordRoute } from '../types';

export async function authRoutes(server: FastifyInstance) {
	server.post<LoginRoute>('/login', { schema: loginSchema }, loginUser);
	server.post<RegisterRoute>('/register', { schema: registerSchema }, registerUser);
	server.post<GoogleAuthRoute>('/google', { schema: googleAuthSchema }, googleAuth);
	server.post('/refresh', refreshToken);

	server.post<ForgotPasswordRoute>('/forgot-password', { schema: forgotPasswordSchema }, forgotPassword);
	server.post<ResetPasswordRoute>('/reset-password', { schema: resetPasswordSchema }, resetPassword);

	server.post('/logout', { preHandler: protect }, logoutUser);
	server.post('/logout-all', { preHandler: protect }, logoutAllDevices);
}
