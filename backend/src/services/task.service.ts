import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import { CreateTaskInput, UpdateTaskInput } from "../payloadSchema/task.schema";

class TaskService {
    async createTask(userId: number, data: CreateTaskInput) {
        const task = await prisma.task.create({
            data: {
                userId,
                topic: data.topic,
                time: data.time,
                loc: data.loc ?? "",
                remarks: data.remarks ?? "",
                pri: data.pri ?? 3,
                done: data.done ?? false,
                assigner: data.assigner ?? "",
                lastRem: BigInt(0),
            },
        });

        return {
            ...task,
            lastRem: Number(task.lastRem),
        };
    }

    async getTasks(
        userId: number,
        filters?: {
            done?: boolean;
            pri?: number;
            search?: string;
            date?: string; // 'YYYY-MM-DD' or 'all'
            tzOffset?: number; // Timezone offset in minutes (e.g. -330 for IST)
        }
    ) {
        const whereClause: {
            userId: number;
            done?: boolean;
            pri?: number;
            topic?: { contains: string; mode?: 'insensitive' };
            time?: { gte?: Date; lt?: Date };
        } = { userId };

        if (filters?.done !== undefined) {
            whereClause.done = filters.done;
        }

        if (filters?.pri !== undefined) {
            whereClause.pri = filters.pri;
        }

        if (filters?.search) {
            whereClause.topic = { contains: filters.search, mode: 'insensitive' };
        }

        // If date is explicitly 'all', skip date filtering.
        // If a specific date is given, filter for that day.
        // Default behavior (no date specified): return active tasks from start of today onwards.
        // Overdue tasks (before start of today) are excluded and handled strictly in Backlog.
        if (filters?.date !== 'all') {
            const tzOffset = filters?.tzOffset !== undefined ? Number(filters.tzOffset) : 0;
            let targetDateStr = filters?.date;

            if (!targetDateStr) {
                // Compute today's date string in the user's timezone
                const now = new Date();
                const adjustedNow = new Date(now.getTime() - tzOffset * 60 * 1000);
                targetDateStr = `${adjustedNow.getUTCFullYear()}-${String(adjustedNow.getUTCMonth() + 1).padStart(2, '0')}-${String(adjustedNow.getUTCDate()).padStart(2, '0')}`;
                const parts = targetDateStr.split('-').map(Number);
                const [year, month, day] = parts;
                const startUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0) + (tzOffset * 60 * 1000);

                // Show all active tasks from start of today onwards
                whereClause.time = {
                    gte: new Date(startUtcMs),
                };
            } else {
                const parts = targetDateStr.split('-').map(Number);
                if (parts.length === 3 && !parts.some(isNaN)) {
                    const [year, month, day] = parts;
                    // startUtc = midnight of that day in UTC shifted by tzOffset
                    const startUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0) + (tzOffset * 60 * 1000);
                    const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;

                    whereClause.time = {
                        gte: new Date(startUtcMs),
                        lt: new Date(endUtcMs),
                    };
                }
            }
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            orderBy: [
                { done: 'asc' },
                { pri: 'asc' },
                { time: 'asc' },
            ],
        });

        return tasks.map((task) => ({
            ...task,
            lastRem: Number(task.lastRem),
        }));
    }

    async getTaskById(userId: number, taskId: number) {
        const task = await prisma.task.findFirst({
            where: { id: taskId, userId },
        });

        if (!task) {
            throw new AppError(404, 'Task not found');
        }

        return {
            ...task,
            lastRem: Number(task.lastRem),
        };
    }

    async updateTask(userId: number, taskId: number, data: UpdateTaskInput) {
        const existingTask = await prisma.task.findFirst({
            where: { id: taskId, userId },
        });

        if (!existingTask) {
            throw new AppError(404, 'Task not found');
        }

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(data.topic !== undefined && { topic: data.topic }),
                ...(data.time !== undefined && { time: data.time }),
                ...(data.loc !== undefined && { loc: data.loc }),
                ...(data.remarks !== undefined && { remarks: data.remarks }),
                ...(data.pri !== undefined && { pri: data.pri }),
                ...(data.done !== undefined && { done: data.done }),
                ...(data.assigner !== undefined && { assigner: data.assigner }),
            },
        });

        return {
            ...updatedTask,
            lastRem: Number(updatedTask.lastRem),
        };
    }

    async toggleTask(userId: number, taskId: number, forceDone?: boolean) {
        const existingTask = await prisma.task.findFirst({
            where: { id: taskId, userId },
        });

        if (!existingTask) {
            throw new AppError(404, 'Task not found');
        }

        const newDone = forceDone !== undefined ? forceDone : !existingTask.done;

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: { done: newDone },
        });

        return {
            ...updatedTask,
            lastRem: Number(updatedTask.lastRem),
        };
    }

    async deleteTask(userId: number, taskId: number) {
        const existingTask = await prisma.task.findFirst({
            where: { id: taskId, userId },
        });

        if (!existingTask) {
            throw new AppError(404, 'Task not found');
        }

        await prisma.task.delete({
            where: { id: taskId },
        });

        return { message: "Task deleted successfully" };
    }
}

export const taskService = new TaskService();
