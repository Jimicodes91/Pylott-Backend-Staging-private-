import { body } from 'express-validator';

export const createCompanyValidationRule = [
	body('name', 'Name cannot be empty').not().isEmpty(),
	body('industryType', 'industryType cannot be empty').not().isEmpty(),
	body('size', 'company size cannot be empty').not().isEmpty(),
	body('country', 'country cannot be empty').not().isEmpty(),
	body('address', 'address cannot be empty').not().isEmpty(),
	body('city', 'city cannot be empty').not().isEmpty(),
];
