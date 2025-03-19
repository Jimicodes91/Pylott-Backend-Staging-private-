import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ObjectLiteral } from '@shared/types/general.type';

const successResponse = (res: Response, message: string, data?: ObjectLiteral, statusCode = StatusCodes.OK) => {
  res.status(statusCode).json({ success: true, message, data });
};

const errorResponse = (res: Response, message: string, data?: ObjectLiteral, statusCode = StatusCodes.BAD_REQUEST) => {
  res.status(statusCode).json({ success: false, message, data });
};

const genericResponse = ({ res, data, statusCode }: { res: Response; data: { status: boolean; message: string; data?: ObjectLiteral }; statusCode?: StatusCodes }) => {
  if (data.status !== true) return errorResponse(res, data.message, data?.data, statusCode);

  return successResponse(res, data.message, data?.data, statusCode);
};

export { successResponse, errorResponse, genericResponse };
