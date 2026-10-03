import { Request, Response, NextFunction } from 'express';
import { CreateAccountInput } from '../payloadSchema/auth.schema';
import { authService } from '../services/auth.service';
import { env } from '../config/env';

class AuthController {
    createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password }: CreateAccountInput = req.body || {};
            if (!email || !password) {
                res.status(400).json({ error: 'Authentication fields are required.' });
                return;
            }
            await authService.initiateSignup(req.body);
            res.status(200).json({
                message: '😎 Registration Successful',
            });
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;
            const { token, user } = await authService.login(email, password);

            res.cookie(env.userCookieName, token, {
                httpOnly: true,
                secure: env.isProduction,
                sameSite: env.isProduction ? 'none' : 'lax',
                maxAge: env.expire_cookie,
                path: '/',
            });

            res.status(200).json({
                success: true,
                message: 'Admin authentication successful',
                user,
                token,
            });
        } catch (error) {
            next(error);
        }
    };

    logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.clearCookie(env.userCookieName, {
                httpOnly: true,
                secure: env.isProduction,
                sameSite: env.isProduction ? 'none' : 'lax',
                path: '/',
            });
            res.status(200).json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            next(error);
        }
    }

    getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const userProfile = await authService.getCurrentUser(req.user.id);
            res.status(200).json({
                success: true,
                user: userProfile,
            });
        } catch (error) {
            next(error);
        }
    };
}

export const authController = new AuthController();
