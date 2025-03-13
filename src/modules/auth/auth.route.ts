import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { AuthController } from './auth.controller';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { adminSignupValidationRule } from '@/shared/validations/auth';

const authController = container.resolve(AuthController);

export const authRoutes = (prefix: string, server: Server) => {
  server.post(`${prefix}/admin-signup`, schemaValidator(adminSignupValidationRule), authController.signup);

  // server.post('/company-admin-signup', signUpCompanyAdminValidator, SignUpCompanyAdmin);
  // server.post('/', signInValidator, signInUser);
  // server.get('/verify-email', verifyEmail);
  // server.post('/resend-verification-email', resendVerificationEmail);
  // server.post('/forgot-password', forgotPassword);
  // server.post('/reset-password', resetPasswordController);
  // server.post('/send-invite', inviteTeamMember);
  // server.post('/complete-registration', registerInvitedUser);
  // server.post('/add-client', authenticateUser, authorizeRole([UserRole.COMPANY_ADMIN]), addClient);
  // server.post('/update-password', authenticateUser, updatePassword);
};
