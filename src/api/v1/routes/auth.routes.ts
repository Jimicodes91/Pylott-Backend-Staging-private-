import { Router } from "express";
import { signUpAdminValidator } from "../middleware/validators/user.validator";
import { SignUpAdmin, verifyEmail } from "../controllers/auth.controller";


const authRouter = Router()

authRouter.post('/admin-signup', signUpAdminValidator, SignUpAdmin);
authRouter.get('/verify-email', verifyEmail);

export default authRouter;