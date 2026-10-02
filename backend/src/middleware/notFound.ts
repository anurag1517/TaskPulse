import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/appError";

export function notFound(req: Request, _res: Response, next: NextFunction): void {
    next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
