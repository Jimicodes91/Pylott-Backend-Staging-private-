import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
	addClientService,
	AdminSignup,
	CompanyAdminSignup,
	completeRegistration,
	forgotPasswordService,
	resendVerificationEmailService,
	resetPasswordService,
	sendInvitation,
	signIn,
	updatePasswordService,
	verifyEmailService,
} from '../services/auth.service';
import { errorResponse, successResponse } from '../middleware/response.middleware';
import { JwtPayload } from 'jsonwebtoken';
import User from '../models/user.model';
import HttpError from '../utils/errorHandler';

/**
 * Sign up a new user.
 * @param req - Express request object
 * @param res - Express response object
 * @returns Response with success or error message
 */
export const SignUpAdmin = async (req: Request, res: Response) => {
	const validationErrors = validationResult(req);
	if (validationErrors.array().length > 0) {
		return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
	}
	try {
		const newUser = await AdminSignup(req.body);
		return successResponse(res, newUser, 'User created successfully ✅, check email to verify account');
	} catch (error: any) {
		return errorResponse(res, undefined, error.message, error.statusCode);
	}
};

export const SignUpCompanyAdmin = async (req: Request, res: Response) => {
	const validationErrors = validationResult(req);
	if (validationErrors.array().length > 0) {
		return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
	}
	try {
		const newUser = await CompanyAdminSignup(req.body);
		return successResponse(res, newUser, 'User created successfully ✅, check email to verify account');
	} catch (error: any) {
		return errorResponse(res, undefined, error.message, error.statusCode);
	}
};

export const signInUser = async (req: Request, res: Response) => {
	const validationErrors = validationResult(req);

	if (validationErrors.array().length > 0) {
		return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
	}

	try {
		const loginData = await signIn(req.body);

		return successResponse(res, loginData, 'User logged in successfully ✅');
	} catch (error: any) {
		return errorResponse(res, undefined, error.message, error.statusCode);
	}
};

export const verifyEmail = async (req: Request, res: Response) => {
	const { token } = req.query;

	try {
		if (!token) {
			return errorResponse(res, undefined, 'Token is required', 400);
		}

		const user = await verifyEmailService(token as string);
		return successResponse(res, user, 'email verified successfully', 200);
	} catch (error: any) {
		return errorResponse(res, undefined, error.message, error.statusCode);
	}
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
	const { email } = req.body;

	if (!email) {
		return errorResponse(res, 'Email is required', 'VALIDATION_ERROR', 400);
	}

	try {
		const response = await resendVerificationEmailService(email);
		return successResponse(res, response, 'Verification email sent', 200);
	} catch (error: any) {
		return errorResponse(res, error.message, 'EMAIL_ERROR', error.statusCode || 500);
	}
};

export const forgotPassword = async (req: Request, res: Response) => {
	const { email } = req.body;

	try {
		if (!email) {
			return errorResponse(res, 'Email is required', 'VALIDATION_ERROR', 400);
		}

		const result = await forgotPasswordService(email);
		return successResponse(res, result, 'Forgot Password mail sent successfully', 200);
	} catch (error: any) {
		return errorResponse(res, error.message, 'EMAIL_ERROR', error.statusCode || 500);
	}
};
export const resetPasswordController = async (req: Request, res: Response) => {
	const { token, newPassword } = req.body;

	try {
		if (!token || !newPassword) {
			return errorResponse(res, undefined, 'Token, email, and new password are required', 400);
		}

		const result = await resetPasswordService(token, newPassword);
		return successResponse(res, result, 'Password successfully changed', 200);
	} catch (error: any) {
		return errorResponse(res, error.message, 'EMAIL_ERROR', error.statusCode || 500);
	}
};

export const inviteTeamMember = async (req: Request, res: Response) => {
	// Step 1: Validate the request data
	const validationErrors = validationResult(req);
	if (validationErrors.array().length > 0) {
		return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
	}

	try {
		//console.log(req.user)

		const { email, role } = req.body;
		//const adminId = (req as any).user._id
		const { id: adminId } = req.query; // Extract adminId from query params
		// Assuming the admin's ID is stored in req.user

		// Step 2: Call the sendInvitation service
		const result = await sendInvitation(adminId as string, email, role);

		// Step 3: Return a success response
		return successResponse(res, result, 'Invitation sent successfully ✅');
	} catch (error: any) {
		// Step 4: Handle errors
		return errorResponse(res, undefined, error.message, error.statusCode || 500);
	}
};

export const registerInvitedUser = async (req: Request, res: Response) => {
	// Step 1: Validate the request data
	const validationErrors = validationResult(req);
	if (validationErrors.array().length > 0) {
		return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
	}

	try {
		const { email, password, companyId } = req.body;

		// Step 2: Call the completeRegistration service
		const newUser = await completeRegistration(email, password, companyId);

		// Step 3: Return a success response
		return successResponse(res, newUser, 'Registration completed successfully ✅');
	} catch (error: any) {
		// Step 4: Handle errors
		return errorResponse(res, undefined, error.message, error.statusCode || 500);
	}
};

export const addClient = async (req: Request, res: Response) => {
	// Step 1: Validate the request data
	const validationErrors = validationResult(req);
	if (validationErrors.array().length > 0) {
		return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
	}

	try {
		const { name, email } = req.body;
		const adminId = (req as any).user?._id; // Assuming the admin's ID is stored in req.user

		const admin = await User.findById(adminId);
		if (!admin) {
			throw new HttpError('Admin not found', 404);
		}

		const companyId = admin.company;
		if (!companyId) {
			throw new HttpError('Admin is not associated with a company', 400);
		}

		const result = await addClientService(name, email, companyId);

		return successResponse(res, result, 'Client added successfully ✅');
	} catch (error: any) {
		return errorResponse(res, undefined, error.message, error.statusCode || 500);
	}
};

export const updatePassword = async (req: Request, res: Response) => {
	const validationErrors = validationResult(req);
	if (validationErrors.array().length > 0) {
		return errorResponse(res, validationErrors.array(), 'Check your form, make sure all fields are valid', 422);
	}

	try {
		const { currentPassword, newPassword } = req.body;
		const userId = (req as any).user._id; // Assuming the user's ID is stored in req.user

		// Step 2: Call the updatePasswordService
		const result = await updatePasswordService(userId, currentPassword, newPassword);

		// Step 3: Return a success response
		return successResponse(res, result, 'Password updated successfully ✅');
	} catch (error: any) {
		// Step 4: Handle errors
		return errorResponse(res, undefined, error.message, error.statusCode || 500);
	}
};
