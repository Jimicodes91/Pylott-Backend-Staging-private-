import { NextFunction, Request, Response } from 'express';
import { ValidationChain } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

import { errorResponse } from '@shared/utils/api-response';

export const schemaValidator = (schemaValidationRules: ValidationChain[]) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    for (const validation of schemaValidationRules) {
      const result = await validation.run(request);

      if (result.isEmpty()) return next();

      return errorResponse(response, 'Validation Error', result.array(), StatusCodes.BAD_REQUEST);
    }
  };
};
