import { Response } from "express";

const successResponse = (res: Response, data: any, message = "Success", statusCode = 200) => {
	res.status(statusCode).json({ success: true, message, data });
};

const errorResponse = (
	res: Response,
	data = {},
	message = "Internal Server Error",
	statusCode = 500
) => {
	res.status(statusCode).json({ success: false, message, data });
};

export { successResponse, errorResponse };