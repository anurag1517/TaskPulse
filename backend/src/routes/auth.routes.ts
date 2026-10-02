import { Router } from "express";
import { validate } from "../middleware/validate";
import { createAccountSchema, loginSchema } from "../payloadSchema/auth.schema";
import { authController } from "../controllers/auth.controller";
import { userAuthMiddleware } from "../middleware/user.middleware";

export const authRouter = Router();

authRouter.post('/createAccount', validate(createAccountSchema), authController.createAccount);
authRouter.post('/signup', validate(createAccountSchema), authController.createAccount);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.get('/me', userAuthMiddleware, authController.getMe);
authRouter.post('/logout', userAuthMiddleware, authController.logout);