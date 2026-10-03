import { Request, Response, NextFunction } from 'express';
import { logService } from '../services/log.service';
import { CreateLogInput } from '../payloadSchema/log.schema';

class LogController {
    getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
            const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10)) : 5;
            const tzOffset = req.query.tzOffset ? parseInt(req.query.tzOffset as string, 10) : 0;

            const result = await logService.getDayWiseLogs(userId, page, limit, tzOffset);

            res.status(200).json({
                success: true,
                pagination: result.pagination,
                data: result.data,
                stats: result.stats,
            });
        } catch (error) {
            next(error);
        }
    };

    createLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const { msg, icon }: CreateLogInput = req.body;

            const log = await logService.addLog(userId, msg, icon);

            res.status(201).json({
                success: true,
                message: 'Log entry recorded',
                data: log,
            });
        } catch (error) {
            next(error);
        }
    };

    clearLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const result = await logService.clearLogs(userId);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    };
}

export const logController = new LogController();
