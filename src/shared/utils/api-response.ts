import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ObjectLiteral } from '@shared/types/general.type';

const successResponse = (res: Response, message: string, data?: ObjectLiteral, statusCode = StatusCodes.OK) => {
	res.status(statusCode).json({ success: true, message, data });
};

const errorResponse = (res: Response, message: string, data?: ObjectLiteral, statusCode = StatusCodes.BAD_REQUEST) => {
	res.status(statusCode).json({ success: false, message, data });
};

export { successResponse, errorResponse };
