import { body, ValidationChain } from 'express-validator';

/**
 * Validates a name field to ensure it doesn't contain numbers
 * @param fieldName - The name of the field to validate (default: 'name')
 * @param isOptional - Whether the field is optional (default: false)
 * @param options - Optional configuration object
 * @returns express-validator validation chain
 */
export const validateName = (
  fieldName: string = 'name',
  isOptional: boolean = false,
  options?: {
    minLength?: number;
    maxLength?: number;
    customMessage?: string;
    customSanitizer?: (value: string) => string;
  },
): ValidationChain => {
  const customMessage = options?.customMessage || 'Numbers are not allowed in name fields';

  let validation: ValidationChain;

  if (isOptional) {
    validation = body(fieldName).optional().isString().withMessage(`${fieldName} must be a string`).trim();
  } else {
    validation = body(fieldName, `${fieldName} is required`).not().isEmpty().isString().withMessage(`${fieldName} must be a string`).trim();
  }

  // Add length constraints if provided
  if (options?.minLength !== undefined && options?.maxLength !== undefined) {
    validation = validation.isLength({ min: options.minLength, max: options.maxLength }).withMessage(`${fieldName} must be between ${options.minLength} and ${options.maxLength} characters`);
  } else if (options?.minLength !== undefined) {
    validation = validation.isLength({ min: options.minLength }).withMessage(`${fieldName} must be at least ${options.minLength} characters`);
  } else if (options?.maxLength !== undefined) {
    validation = validation.isLength({ max: options.maxLength }).withMessage(`${fieldName} cannot exceed ${options.maxLength} characters`);
  }

  // Add custom sanitizer if provided
  if (options?.customSanitizer) {
    validation = validation.customSanitizer(options.customSanitizer);
  }

  // Add the number validation (allow letters, spaces, hyphens, apostrophes, slashes, and parentheses)
  return validation.matches(/^[a-zA-Z\s'\/()&,-]+$/).withMessage(customMessage);
};
