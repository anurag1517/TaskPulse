import { prisma } from "../lib/prisma";

export interface BacklogTaskItem {
    id: number;
    topic: string;
    pri: number;
    time: Date;
    loc: string | null;
    remarks: string | null;
    done: boolean;
    assigner: string | null;
}

export interface DayWiseBacklog {
    date: string;
    displayDate: string;
    isOverdue: boolean;
    isToday: boolean;
    isFuture: boolean;
    totalTasks: number;
    p1Count: number;
    p2Count: number;
    p3Count: number;
    p4Count: number;
    emoji: string;
    statusLabel: string;
    tasks: BacklogTaskItem[];
}

export interface BacklogPagination {
    page: number;
    limit: number;
    totalDays: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface BacklogStats {
    totalBacklog: number;
    overdueCount: number;
    todayCount: number;
    futureCount: number;
    p1Count: number;
    p2Count: number;
    p3Count: number;
    p4Count: number;
}

class BacklogService {
    async getDayWiseBacklog(
        userId: number,
        page: number = 1,
        limit: number = 3,
        tzOffset: number = 0,
        targetDate?: string,
        scope: 'all' | 'overdue' | 'upcoming' = 'all'
    ) {
        const safeLimit = Math.max(1, Math.min(50, limit));
        const safePage = Math.max(1, page);

        // Fetch all pending (incomplete) tasks for this user
        const tasks = await prisma.task.findMany({
            where: {
                userId,
                done: false,
            },
            orderBy: [
                { pri: 'asc' },
                { time: 'asc' },
                { id: 'asc' },
            ],
        });

        // Compute today & yesterday date strings in user's local timezone
        const now = new Date();
        const adjustedNow = new Date(now.getTime() - tzOffset * 60 * 1000);
        const todayKey = `${adjustedNow.getUTCFullYear()}-${String(adjustedNow.getUTCMonth() + 1).padStart(2, '0')}-${String(adjustedNow.getUTCDate()).padStart(2, '0')}`;

        const yesterdayAdjusted = new Date(adjustedNow.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayKey = `${yesterdayAdjusted.getUTCFullYear()}-${String(yesterdayAdjusted.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterdayAdjusted.getUTCDate()).padStart(2, '0')}`;

        // Group tasks by day
        const dayMap = new Map<string, { date: string; dateObj: Date; tasks: typeof tasks }>();

        for (const task of tasks) {
            const taskTime = new Date(task.time);
            const adjustedTask = new Date(taskTime.getTime() - tzOffset * 60 * 1000);
            const dateKey = `${adjustedTask.getUTCFullYear()}-${String(adjustedTask.getUTCMonth() + 1).padStart(2, '0')}-${String(adjustedTask.getUTCDate()).padStart(2, '0')}`;

            if (!dayMap.has(dateKey)) {
                dayMap.set(dateKey, {
                    date: dateKey,
                    dateObj: new Date(Date.UTC(adjustedTask.getUTCFullYear(), adjustedTask.getUTCMonth(), adjustedTask.getUTCDate())),
                    tasks: [],
                });
            }

            dayMap.get(dateKey)!.tasks.push(task);
        }

        // Sort days chronologically ascending (oldest overdue first -> today -> upcoming)
        let sortedDayKeys = Array.from(dayMap.keys()).sort((a, b) => a.localeCompare(b));

        // Filter by scope if requested
        if (scope === 'overdue') {
            sortedDayKeys = sortedDayKeys.filter((k) => k < todayKey);
        } else if (scope === 'upcoming') {
            sortedDayKeys = sortedDayKeys.filter((k) => k >= todayKey);
        }

        // If filtering by a specific date, narrow down to that date
        if (targetDate && targetDate.trim()) {
            const normalizedDate = targetDate.trim();
            sortedDayKeys = sortedDayKeys.filter((k) => k === normalizedDate);
        }

        const totalDays = sortedDayKeys.length;
        const totalPages = Math.max(1, Math.ceil(totalDays / safeLimit));
        const currentPage = Math.min(safePage, totalPages);
        const offset = (currentPage - 1) * safeLimit;
        const pageDayKeys = sortedDayKeys.slice(offset, offset + safeLimit);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const days: DayWiseBacklog[] = pageDayKeys.map((key) => {
            const entry = dayMap.get(key)!;
            const dayTasks = entry.tasks;
            const totalTasks = dayTasks.length;
            const p1Count = dayTasks.filter((t) => t.pri === 1).length;
            const p2Count = dayTasks.filter((t) => t.pri === 2).length;
            const p3Count = dayTasks.filter((t) => t.pri === 3).length;
            const p4Count = dayTasks.filter((t) => t.pri === 4).length;

            const isOverdue = key < todayKey;
            const isToday = key === todayKey;
            const isFuture = key > todayKey;

            let emoji = "📋";
            let statusLabel = "Backlog";
            if (isOverdue) {
                emoji = p1Count > 0 ? "🚨" : "⚠️";
                statusLabel = "Overdue Backlog";
            } else if (isToday) {
                emoji = "⚡";
                statusLabel = "Due Today";
            } else {
                emoji = "📅";
                statusLabel = "Upcoming";
            }

            const dateObj = entry.dateObj;
            const formattedDate = `${monthNames[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}, ${dateObj.getUTCFullYear()}`;

            let displayDate = `${dayNames[dateObj.getUTCDay()]}, ${formattedDate}`;
            if (key === todayKey) {
                displayDate = `Today • ${formattedDate}`;
            } else if (key === yesterdayKey) {
                displayDate = `Yesterday • ${formattedDate}`;
            }

            return {
                date: key,
                displayDate,
                isOverdue,
                isToday,
                isFuture,
                totalTasks,
                p1Count,
                p2Count,
                p3Count,
                p4Count,
                emoji,
                statusLabel,
                tasks: dayTasks.map((t) => ({
                    id: t.id,
                    topic: t.topic,
                    pri: t.pri,
                    time: t.time,
                    loc: t.loc,
                    remarks: t.remarks,
                    done: t.done,
                    assigner: t.assigner,
                })),
            };
        });

        // Compute overall lifetime backlog stats
        const totalBacklog = tasks.length;
        let overdueCount = 0;
        let todayCount = 0;
        let futureCount = 0;
        let p1Count = 0;
        let p2Count = 0;
        let p3Count = 0;
        let p4Count = 0;

        for (const t of tasks) {
            const taskTime = new Date(t.time);
            const adjustedTask = new Date(taskTime.getTime() - tzOffset * 60 * 1000);
            const dateKey = `${adjustedTask.getUTCFullYear()}-${String(adjustedTask.getUTCMonth() + 1).padStart(2, '0')}-${String(adjustedTask.getUTCDate()).padStart(2, '0')}`;

            if (dateKey < todayKey) overdueCount++;
            else if (dateKey === todayKey) todayCount++;
            else futureCount++;

            if (t.pri === 1) p1Count++;
            else if (t.pri === 2) p2Count++;
            else if (t.pri === 3) p3Count++;
            else if (t.pri === 4) p4Count++;
        }

        return {
            pagination: {
                page: currentPage,
                limit: safeLimit,
                totalDays,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1,
            },
            data: days,
            stats: {
                totalBacklog,
                overdueCount,
                todayCount,
                futureCount,
                p1Count,
                p2Count,
                p3Count,
                p4Count,
            },
        };
    }

    async moveTaskToToday(userId: number, taskId: number, _tzOffset: number = 0) {
        const task = await prisma.task.findFirst({
            where: { id: taskId, userId },
        });

        if (!task) {
            throw new Error("Task not found");
        }

        // Reschedule task to today's date + 1 hour from now
        const now = new Date();
        const newTime = new Date(now.getTime() + 60 * 60 * 1000);

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                time: newTime,
            },
        });

        return {
            ...updated,
            lastRem: Number(updated.lastRem),
        };
    }
}

export const backlogService = new BacklogService();
