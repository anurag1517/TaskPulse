import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../error/appError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { user } from "../types/User";

declare global {
    namespace Express {
        interface Request {
            user?: user;
        }
    }
}

export const userAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token =
            req.cookies?.[env.userCookieName] ||
            req.headers.authorization?.replace(/^Bearer\s+/i, '');

        if (!token) {
            return next(new AppError(401, 'Unauthorized: No token provided'));
        }

        const decoded = jwt.verify(token, env.userJwtSecret);
        if (typeof decoded === 'string' || !decoded) {
            return next(new AppError(401, 'Invalid token payload'));
        }

        const payload = decoded as JwtPayload & { id: number; email: string; name?: string | null };
        if (!payload.id || !payload.email) {
            return next(new AppError(401, 'Malformed token payload'));
        }

        req.user = {
            id: Number(payload.id),
            email: payload.email,
            name: payload.name ?? null,
        };

        next();
    } catch (error) {
        next(new AppError(401, 'Invalid or expired token'));
    }
};
