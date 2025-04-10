import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { AuthController } from './auth.controller';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import {
  addClientValidator,
  adminSignupValidationRule,
  completeRegistrationValidationRule,
  emailValidationRule,
  loginValidationRule,
  resetPasswordValidationRule,
  signUpCompanyAdminValidator,
  updatePasswordValidatorRule,
} from '@/shared/validations/auth';
import { authenticateUser } from '@/shared/middlewares/guard.middleware';

const authController = container.resolve(AuthController);

export const authRoutes = (prefix: string, server: Server) => {
  server.post(`${prefix}/admin-signup`, schemaValidator(adminSignupValidationRule), authController.signUpAdmin);

  server.post(`${prefix}/company-admin-signup`, schemaValidator(signUpCompanyAdminValidator), authController.signUpCompanyAdmin);

  server.post(`${prefix}/login`, schemaValidator(loginValidationRule), authController.signIn);

  server.get(`${prefix}/verify`, authController.verifyEmail);

  server.post(`${prefix}/resend-verification`, schemaValidator(emailValidationRule), authController.resendVerificationEmail);

  server.post(`${prefix}/forgot-password`, schemaValidator(emailValidationRule), authController.forgotPassword);

  server.post(`${prefix}/reset-password`, schemaValidator(resetPasswordValidationRule), authController.resetPassword);

  server.post(`${prefix}/send-invite`, authenticateUser, authController.sendInvite);

  server.post(`${prefix}/complete-registration`, schemaValidator(completeRegistrationValidationRule), authController.completeRegistration);

  server.post(`${prefix}/add-client`, schemaValidator(addClientValidator), authController.addClient);

  server.post(`${prefix}/update-password`, schemaValidator(updatePasswordValidatorRule), authController.updatePassword);

  server.get(`${prefix}/auth/google`, authController.getGoogleAuthURL);
  server.get(`${prefix}/auth/google/callback`, authController.googleAuthCallback);
};
