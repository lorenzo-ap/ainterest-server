import mongoose from 'mongoose';

export const connectDB = async (url: string) => {
	mongoose.set('strictQuery', true);

	mongoose
		.connect(url)
		.then(() => console.log('MongoDB connected'))
		.catch((err) => console.log(err));
};
