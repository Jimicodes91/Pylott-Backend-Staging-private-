import jwt from 'jsonwebtoken';

export const generateToken = (email: string, userId: any): string => {
	return jwt.sign({ email, id: userId }, process.env.JWT_SECRET!, {
		expiresIn: '1d',
	});
};

export const generateRandomPassword = (): string => {
	return Math.floor(10000 + Math.random() * 90000).toString();
};
