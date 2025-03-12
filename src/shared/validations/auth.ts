import { body } from 'express-validator';

export const adminSignupValidationRule = [
	// body("first_name", "First name is required").not().isEmpty(),
	// body("last_name", "Last name is required").not().isEmpty(),
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
	body('name', 'Name can not be Empty').not().isEmpty(),
	body('gender', 'Gender can not be Empty').not().isEmpty(),
];

export const signUpCompanyAdminValidator = [
	// body("firstname", "First name is required").not().isEmpty(),
	body('name', 'Name is required').not().isEmpty(),
	body('email', 'Email is required').not().isEmpty(),
	body('password', 'Password cannot be empty').not().isEmpty(),
	body('password', 'The minimun password length is 6 characters').isLength({
		min: 6,
	}),
];
