import { NextFunction, Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

import { errorResponse } from '@shared/utils/api-response';

export const schemaValidator = (schemaValidationRules: ValidationChain[]) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(schemaValidationRules.map((validation) => validation.run(request)));

    // Get all validation errors
    const result = validationResult(request);

    if (result.isEmpty()) return next();

    // Format validation errors to be more descriptive
    const errors = result.array().map((err: any) => ({
      field: err.param || err.location,
      message: err.msg,
      value: err.value,
    }));

    // Get the first error message as the main message, or use a generic one
    const mainMessage = errors.length > 0 ? errors[0].message : 'Validation failed';

    return errorResponse(response, mainMessage, errors, StatusCodes.BAD_REQUEST);
  };
};
