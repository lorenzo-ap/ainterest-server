import mongoose from 'mongoose';

export const connectDB = async (url: string) => {
	mongoose.set('strictQuery', true);

	return mongoose.connect(url);
};
