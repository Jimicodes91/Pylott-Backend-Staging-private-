import { body } from 'express-validator';
import { validateName } from './common';

export const adminSignupValidationRule = [
  // body("first_name", "First name is required").not().isEmpty(),
  // body("last_name", "Last name is required").not().isEmpty(),
  validateName('name'),
  body('email', 'Email is required').not().isEmpty(),
  body('password', 'Password cannot be empty').not().isEmpty(),
  body('password', 'The minimum password length is 6 characters').isLength({ min: 6 }),
];

export const loginValidationRule = [
  body('email', 'Email can not be Empty').not().isEmpty(),
  body('email', 'Invalid email').isEmail(),
  body('password', 'Password can not be Empty').not().isEmpty(),
  body('password', 'The minimum password length is 8 characters').isLength({ min: 8 }),
];

export const signUpValidator = [
  body('email', 'Email can not be Empty').not().isEmpty(),
  body('username', 'username can not be Empty').not().isEmpty(),
  body('email', 'Invalid email').isEmail(),
  body('password', 'Password can not be Empty').not().isEmpty(),
  body('password', 'The minimum password length is 8 characters').isLength({
    min: 8,
  }),
  // validateName('name'),
  body('gender', 'Gender can not be Empty').not().isEmpty(),
];

export const signUpCompanyAdminValidator = [
  // body("firstname", "First name is required").not().isEmpty(),
  validateName('name'),
  body('email', 'Email is required').not().isEmpty(),
  body('password', 'Password cannot be empty').not().isEmpty(),
  body('password', 'The minimun password length is 6 characters').isLength({
    min: 6,
  }),
];

/** Self-serve workspace signup: email + password + name → new workspace, user is super_admin, no approval */
export const workspaceSignupValidator = [
  validateName('name'),
  body('email', 'Email is required').not().isEmpty().isEmail().withMessage('Valid email is required'),
  body('password', 'Password cannot be empty').not().isEmpty(),
  body('password', 'The minimum password length is 8 characters').isLength({ min: 8 }),
];

export const emailValidationRule = [body('email', 'Email is required').not().isEmpty(), body('email', 'Invalid email').isEmail()];

/** Invite admin or consultant: body { email } */
export const inviteEmailValidator = [body('email', 'Email is required').not().isEmpty().isEmail().withMessage('Valid email is required')];

export const resetPasswordValidationRule = [
  body('token', 'Token is required').not().isEmpty(),
  body('newPassword', 'New password is required').not().isEmpty(),
  body('newPassword', 'The minimum password length is 8 characters').isLength({ min: 8 }),
];

export const completeRegistrationValidationRule = [body('token', 'token is required').not().isEmpty(), body('password', 'Password is required').not().isEmpty(), validateName('name')];

export const addClientValidator = [validateName('name'), body('email', 'Email is required').not().isEmpty(), body('password', 'Password is required').not().isEmpty()];

export const updatePasswordValidatorRule = [
  body('userId', 'userId is required').not().isEmpty(),
  body('currentPassword', 'current password is required').not().isEmpty(),
  body('newPassword', 'new password is required').not().isEmpty(),
];

/** Set password with token (e.g. after reactivation). Body: { token, newPassword } */
export const setPasswordWithTokenValidator = [
  body('token', 'Token is required').not().isEmpty(),
  body('newPassword', 'New password is required').not().isEmpty(),
  body('newPassword', 'The minimum password length is 8 characters').isLength({ min: 8 }),
];
