import { Router } from "express";
import { signUpAdminValidator } from "../middleware/validators/user.validator";
import { forgotPassword, resendVerificationEmail, resetPasswordController, SignUpAdmin,verifyEmail } from "../controllers/auth.controller";


const authRouter = Router()

authRouter.post('/admin-signup', signUpAdminValidator, SignUpAdmin);
authRouter.get('/verify-email', verifyEmail);
authRouter.post("/resend-verification-email", resendVerificationEmail);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post('/reset-password', resetPasswordController);

export default authRouter;