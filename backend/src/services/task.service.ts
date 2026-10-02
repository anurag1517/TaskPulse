import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import { CreateTaskInput, UpdateTaskInput } from "../payloadSchema/task.schema";
import { logService } from "./log.service";

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

        // Automatically record daily task log
        await logService.addLog(
            userId,
            `Created task: "${task.topic}" [P${task.pri}]`,
            "📋"
        );

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

        if (data.done !== undefined && data.done !== existingTask.done) {
            const icon = data.done ? "✅" : "⏳";
            const statusText = data.done ? "Completed" : "Reopened";
            await logService.addLog(
                userId,
                `${statusText} task: "${updatedTask.topic}"`,
                icon
            );
        } else {
            await logService.addLog(
                userId,
                `Updated task: "${updatedTask.topic}"`,
                "✏️"
            );
        }

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

        await logService.addLog(
            userId,
            newDone
                ? `Completed task: "${updatedTask.topic}"`
                : `Marked task incomplete: "${updatedTask.topic}"`,
            newDone ? "✅" : "⏳"
        );

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

        await logService.addLog(
            userId,
            `Deleted task: "${existingTask.topic}"`,
            "🗑️"
        );

        return { message: "Task deleted successfully" };
    }
}

export const taskService = new TaskService();
