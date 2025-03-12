import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { errorResponse } from '../utils/api-response';

export const errorHandler = (err, _: Request, response: Response, next: NextFunction) => {
	if (response.headersSent) return next(err);

	const message = err?.message || 'Unable to process your request. Please try again';

	const statusCode = err.statusCode || StatusCodes.BAD_REQUEST;

	errorResponse(response, message, {}, statusCode);
};

export const notFoundHandler = (_: Request, response: Response) => {
	const message = "We can't find the route you are trying to access";

	errorResponse(response, message, {}, StatusCodes.NOT_FOUND);
};
