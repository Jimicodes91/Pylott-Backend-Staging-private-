import { Router } from "express";
import { signInValidator, signUpAdminValidator, signUpCompanyAdminValidator } from "../middleware/validators/user.validator";
import { addClient, forgotPassword, inviteTeamMember, registerInvitedUser, resendVerificationEmail, resetPasswordController, signInUser, SignUpAdmin,SignUpCompanyAdmin,updatePassword,verifyEmail } from "../controllers/auth.controller";
import { authenticateUser, authorizeRole, verifyJWT } from "../middleware";
import { UserRole } from "../utils/user";


const authRouter = Router()
//middleare usage router.get("/admin-dashboard", authenticateUser, authorizeRole([UserRole.PYLOTT_ADMIN])

authRouter.post('/admin-signup', signUpAdminValidator, SignUpAdmin);
authRouter.post("/company-admin-signup", signUpCompanyAdminValidator,SignUpCompanyAdmin)
authRouter.post('/', signInValidator, signInUser)
authRouter.get('/verify-email', verifyEmail);
authRouter.post("/resend-verification-email", resendVerificationEmail);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post('/reset-password', resetPasswordController);
authRouter.post('/send-invite',  inviteTeamMember);
authRouter.post('/complete-registration', registerInvitedUser);
authRouter.post('/add-client', authenticateUser, authorizeRole([UserRole.COMPANY_ADMIN]), addClient)
authRouter.post('/update-password', authenticateUser, updatePassword);

export default authRouter;