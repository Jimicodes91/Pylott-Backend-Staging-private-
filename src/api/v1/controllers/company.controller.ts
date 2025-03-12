import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse, successResponse } from '../middleware/response.middleware';
import { createCompanyService } from '../services/company.service';
import { JwtPayload } from 'jsonwebtoken';

export const createCompany = async (req: Request, res: Response) => {
	const validationErrors = validationResult(req);

	if (validationErrors.array().length > 0) {
		return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
	}

	// Ensure that req.user exists and has an id
	if (!(req as any).user) {
		return errorResponse(res, undefined, 'User authentication required', 401);
	}
	try {
		const { name, industryType, size, country, address, city, postalcode } = req.body;
		const adminId = (req as any).user._id; // Assuming the admin's ID is stored in req.user
		console.log(adminId);

		// Step 2: Call the createCompanyService
		const newCompany = await createCompanyService(req.body, adminId);
		return successResponse(res, newCompany, 'Company created successfully ✅');
	} catch (error: any) {
		return errorResponse(res, undefined, error.message, error.statusCode);
	}
};
