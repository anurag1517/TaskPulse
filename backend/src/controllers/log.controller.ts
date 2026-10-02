import { Request, Response, NextFunction } from 'express';
import { logService } from '../services/log.service';
import { CreateLogInput } from '../payloadSchema/log.schema';

class LogController {
    getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const limit = req.query.limit ? Number(req.query.limit) : 100;

            const logs = await logService.getLogs(userId, limit);

            res.status(200).json({
                success: true,
                count: logs.length,
                data: logs,
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
