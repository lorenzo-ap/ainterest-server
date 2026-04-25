import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '../../services';
import { getEnvString } from '../../utils/utils';
import { UserModel } from '../users/user.model';
import { RefreshTokenModel } from './refresh-token.model';
import { generateResetToken, RESET_TOKEN_EXPIRY_MS } from './token.service';

export const requestPasswordReset = async (email: string) => {
	const user = await UserModel.findOne({ email });

	if (!user) {
		return;
	}

	const resetToken = generateResetToken(user.id);
	const salt = await bcrypt.genSalt(10);
	const hashedToken = await bcrypt.hash(resetToken, salt);

	user.resetPasswordToken = hashedToken;
	user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

	await user.save();
	await sendPasswordResetEmail(email, resetToken);
};

export const resetUserPassword = async (token: string, password: string) => {
	const jwtResetSecret = getEnvString('JWT_RESET_SECRET');
	const decoded = jwt.verify(token, jwtResetSecret) as jwt.JwtPayload;

	const user = await UserModel.findOne({
		_id: decoded.id,
		resetPasswordExpires: { $gt: new Date() }
	});

	if (!user || !user.resetPasswordToken) {
		return false;
	}

	const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);

	if (!isValidToken) {
		return false;
	}

	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	user.password = hashedPassword;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	await user.save();

	await RefreshTokenModel.deleteMany({ userId: user.id });

	return true;
};
