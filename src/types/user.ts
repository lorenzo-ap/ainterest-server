export enum UserRole {
	User = 'user',
	Admin = 'admin'
}

export interface User {
	id: string;
	username: string;
	email: string;
	password: string;
	photo: string;
	role: UserRole;
	resetPasswordToken?: string;
	resetPasswordExpires?: Date;
}
