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

// Lazy controller resolution to avoid circular dependencies
const getAuthController = () => container.resolve(AuthController);

export const authRoutes = (prefix: string, server: Server) => {
  server.post(`${prefix}/admin-signup`, schemaValidator(adminSignupValidationRule), (req, res) => getAuthController().signUpAdmin(req, res));

  server.post(`${prefix}/company-admin-signup`, schemaValidator(signUpCompanyAdminValidator), (req, res) => getAuthController().signUpCompanyAdmin(req, res));

  server.post(`${prefix}/login`, schemaValidator(loginValidationRule), (req, res) => getAuthController().signIn(req, res));

  server.post(`${prefix}/verify`, (req, res) => getAuthController().verifyEmail(req, res));

  server.post(`${prefix}/resend-verification`, schemaValidator(emailValidationRule), (req, res) => getAuthController().resendVerificationEmail(req, res));

  server.post(`${prefix}/forgot-password`, schemaValidator(emailValidationRule), (req, res) => getAuthController().forgotPassword(req, res));

  server.post(`${prefix}/reset-password`, schemaValidator(resetPasswordValidationRule), (req, res) => getAuthController().resetPassword(req, res));

  server.post(`${prefix}/send-invite`, authenticateUser, (req, res) => getAuthController().sendInvite(req, res));

  server.post(`${prefix}/invite-existing-user`, authenticateUser, (req, res) => getAuthController().inviteExistingUser(req, res));

  server.post(`${prefix}/complete-registration`, schemaValidator(completeRegistrationValidationRule), (req, res) => getAuthController().completeRegistration(req, res));

  server.post(`${prefix}/add-client`, schemaValidator(addClientValidator), (req, res) => getAuthController().addClient(req, res));

  server.post(`${prefix}/update-password`, schemaValidator(updatePasswordValidatorRule), (req, res) => getAuthController().updatePassword(req, res));

  server.post(`${prefix}/switch-organization`, authenticateUser, (req, res) => getAuthController().switchOrganization(req, res));

  server.get(`${prefix}/companies/:companyId/users`, authenticateUser, (req, res) => getAuthController().getCompanyUsersWithStatus(req, res));

  server.post(`${prefix}/resend-invitation`, authenticateUser, (req, res) => getAuthController().resendInvitation(req, res));

  server.post(`${prefix}/logout`, authenticateUser, (req, res) => getAuthController().logout(req, res));

  server.get(`${prefix}/auth/google`, (req, res, next) => getAuthController().getGoogleAuthURL(req, res, next));
  server.get(`${prefix}/auth/google/callback`, (req, res, next) => getAuthController().googleAuthCallback(req, res, next));
};
