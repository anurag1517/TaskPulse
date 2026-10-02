import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { CreateTaskInput, UpdateTaskInput } from '../payloadSchema/task.schema';

class TaskController {
    createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const input: CreateTaskInput = req.body;
            const task = await taskService.createTask(userId, input);

            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: task,
            });
        } catch (error) {
            next(error);
        }
    };

    getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const doneParam = req.query.done;
            const priParam = req.query.pri;
            const searchParam = req.query.search;

            const filters: { done?: boolean; pri?: number; search?: string } = {};

            if (doneParam !== undefined) {
                filters.done = doneParam === 'true';
            }

            if (priParam !== undefined) {
                const parsedPri = Number(priParam);
                if (!isNaN(parsedPri)) {
                    filters.pri = parsedPri;
                }
            }

            if (typeof searchParam === 'string' && searchParam.trim()) {
                filters.search = searchParam.trim();
            }

            const tasks = await taskService.getTasks(userId, filters);

            res.status(200).json({
                success: true,
                count: tasks.length,
                data: tasks,
            });
        } catch (error) {
            next(error);
        }
    };

    getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const taskId = Number(req.params.id);

            const task = await taskService.getTaskById(userId, taskId);

            res.status(200).json({
                success: true,
                data: task,
            });
        } catch (error) {
            next(error);
        }
    };

    updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const taskId = Number(req.params.id);
            const input: UpdateTaskInput = req.body;

            const updatedTask = await taskService.updateTask(userId, taskId, input);

            res.status(200).json({
                success: true,
                message: 'Task updated successfully',
                data: updatedTask,
            });
        } catch (error) {
            next(error);
        }
    };

    toggleTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const taskId = Number(req.params.id);
            const done = req.body?.done !== undefined ? Boolean(req.body.done) : undefined;

            const task = await taskService.toggleTask(userId, taskId, done);

            res.status(200).json({
                success: true,
                message: task.done ? 'Task marked as completed' : 'Task marked as incomplete',
                data: task,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.id;
            const taskId = Number(req.params.id);

            const result = await taskService.deleteTask(userId, taskId);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    };
}

export const taskController = new TaskController();
