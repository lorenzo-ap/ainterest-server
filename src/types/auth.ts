export interface RegisterBody {
	username: string;
	email: string;
	password: string;
}

export interface LoginBody {
	email: string;
	password: string;
}

export interface GoogleAuthBody {
	credential: string;
}

export interface ForgotPasswordBody {
	email: string;
}

export interface ResetPasswordBody {
	token: string;
	password: string;
}
