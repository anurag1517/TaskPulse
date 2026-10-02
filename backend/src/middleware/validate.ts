import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { AppError } from '../error/appError';

export const validate = (schema: ZodType) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const firstIssue = error.issues[0];
                const errorMessage = firstIssue?.message || 'Invalid input data';
                return next(new AppError(400, errorMessage));
            }
            next(error);
        }
    };
};