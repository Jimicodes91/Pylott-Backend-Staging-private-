import * as express from 'express';

export type Server = express.Express;

export type APIResponse<T> = {
	success: boolean;
	message: string;
	data?: T;
};
