import { Router } from "express";
import { validate } from "../middleware/validate";
import { createAccountSchema, loginSchema } from "../payloadSchema/auth.schema";
import { authController } from "../controllers/auth.controller";
import { userAuthMiddleware } from "../middleware/user.middleware";
import { authLimiter } from "../middleware/rateLimiter";

export const authRouter = Router();

authRouter.post('/createAccount', authLimiter, validate(createAccountSchema), authController.createAccount);
authRouter.post('/signup', authLimiter, validate(createAccountSchema), authController.createAccount);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.get('/me', userAuthMiddleware, authController.getMe);
authRouter.post('/logout', userAuthMiddleware, authController.logout);