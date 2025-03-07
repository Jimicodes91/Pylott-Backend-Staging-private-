import { Router } from "express";
import { authenticateSameUser, authenticateUser } from "../middleware";
import { fetchUser, updateUserProfile } from "../controllers/user.controller";

const userRouter = Router();

userRouter.get('/:userId', authenticateUser, fetchUser);
userRouter.put('/profile/:userId', authenticateUser, updateUserProfile);

export default userRouter;