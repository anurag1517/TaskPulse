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
        filters?: { done?: boolean; pri?: number; search?: string }
    ) {
        const whereClause: {
            userId: number;
            done?: boolean;
            pri?: number;
            topic?: { contains: string; mode?: 'insensitive' };
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
