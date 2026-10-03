import { prisma } from "../lib/prisma";

export interface DayLogTask {
    id: number;
    topic: string;
    pri: number;
    time: Date;
    loc: string | null;
    remarks: string | null;
    done: boolean;
    assigner: string | null;
}

export interface DayWiseLog {
    date: string;
    displayDate: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    percentage: number;
    emoji: string;
    statusLabel: string;
    tasks: DayLogTask[];
}

export interface LogPagination {
    page: number;
    limit: number;
    totalDays: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

class LogService {
    // Keep addLog as a graceful no-op so any external callers don't throw,
    // avoiding unnecessary noisy events in the logs
    async addLog(_userId: number, _msg: string, _icon: string = "📝") {
        return null;
    }

    async getDayWiseLogs(userId: number, page: number = 1, limit: number = 5, tzOffset: number = 0) {
        const safeLimit = Math.max(1, Math.min(50, limit));
        const safePage = Math.max(1, page);

        // Fetch all user's tasks ordered by scheduled time
        const tasks = await prisma.task.findMany({
            where: { userId },
            orderBy: [
                { time: 'desc' },
                { id: 'desc' },
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

        // Sort days descending (most recent first)
        const sortedDayKeys = Array.from(dayMap.keys()).sort((a, b) => b.localeCompare(a));
        const totalDays = sortedDayKeys.length;
        const totalPages = Math.max(1, Math.ceil(totalDays / safeLimit));
        const currentPage = Math.min(safePage, totalPages);
        const offset = (currentPage - 1) * safeLimit;
        const pageDayKeys = sortedDayKeys.slice(offset, offset + safeLimit);

        const days: DayWiseLog[] = pageDayKeys.map((key) => {
            const entry = dayMap.get(key)!;
            const dayTasks = entry.tasks;
            const totalTasks = dayTasks.length;
            const completedTasks = dayTasks.filter((t) => t.done).length;
            const pendingTasks = totalTasks - completedTasks;
            const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Pick cool emoji and motivational status based on completion rate
            let emoji = "🎯";
            let statusLabel = "To Do";
            if (percentage === 100) {
                emoji = "🏆";
                statusLabel = "Flawless Day!";
            } else if (percentage >= 80) {
                emoji = "🚀";
                statusLabel = "Crushing It!";
            } else if (percentage >= 60) {
                emoji = "🔥";
                statusLabel = "On Fire!";
            } else if (percentage >= 40) {
                emoji = "⚡";
                statusLabel = "Solid Progress";
            } else if (percentage > 0) {
                emoji = "⏳";
                statusLabel = "In Motion";
            }

            // Human-friendly date representation
            const dateObj = entry.dateObj;
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
                totalTasks,
                completedTasks,
                pendingTasks,
                percentage,
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

        // Compute overall lifetime stats
        const totalTasksAllTime = tasks.length;
        const totalCompletedAllTime = tasks.filter((t) => t.done).length;
        const overallPercentage = totalTasksAllTime > 0 ? Math.round((totalCompletedAllTime / totalTasksAllTime) * 100) : 0;

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
                totalTasksAllTime,
                totalCompletedAllTime,
                overallPercentage,
            },
        };
    }

    async clearLogs(userId: number) {
        await prisma.log.deleteMany({
            where: { userId },
        }).catch(() => {});

        return { message: "Logs cleared successfully" };
    }
}

export const logService = new LogService();
