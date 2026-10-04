import { Request, Response, NextFunction } from 'express';
import { backlogService } from '../services/backlog.service';

class BacklogController {
    getBacklog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1;
            const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string, 10)) : 3;
            const tzOffset = req.query.tzOffset ? parseInt(req.query.tzOffset as string, 10) : 0;
            const date = typeof req.query.date === 'string' && req.query.date.trim() ? req.query.date.trim() : undefined;
            const scope = (req.query.scope as 'all' | 'overdue' | 'upcoming') || 'all';

            const result = await backlogService.getDayWiseBacklog(userId, page, limit, tzOffset, date, scope);

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

    moveToToday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const taskId = parseInt(rawId as string, 10);
            const tzOffset = req.query.tzOffset ? parseInt(req.query.tzOffset as string, 10) : 0;

            const task = await backlogService.moveTaskToToday(userId, taskId, tzOffset);

            res.status(200).json({
                success: true,
                message: 'Task moved to today',
                data: task,
            });
        } catch (error) {
            next(error);
        }
    };
}

export const backlogController = new BacklogController();
