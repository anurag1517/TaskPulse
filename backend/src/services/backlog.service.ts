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

        // Compute today & yesterday date strings in user's local timezone
        const now = new Date();
        const adjustedNow = new Date(now.getTime() - tzOffset * 60 * 1000);
        const todayKey = `${adjustedNow.getUTCFullYear()}-${String(adjustedNow.getUTCMonth() + 1).padStart(2, '0')}-${String(adjustedNow.getUTCDate()).padStart(2, '0')}`;
        const yesterdayAdjusted = new Date(adjustedNow.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayKey = `${yesterdayAdjusted.getUTCFullYear()}-${String(yesterdayAdjusted.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterdayAdjusted.getUTCDate()).padStart(2, '0')}`;

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        // =========================================================================
        // CASE 1: USER SPECIFIES A DATE -> FETCH & RENDER ONLY THAT PARTICULAR DAY
        // =========================================================================
        if (targetDate && targetDate.trim()) {
            const normalizedDate = targetDate.trim();
            const parts = normalizedDate.split('-').map(Number);

            if (parts.length === 3 && !parts.some(isNaN)) {
                const [year, month, day] = parts;
                const startUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0) + (tzOffset * 60 * 1000);
                const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;

                // Query DB strictly for that single day
                const tasks = await prisma.task.findMany({
                    where: {
                        userId,
                        done: false,
                        time: {
                            gte: new Date(startUtcMs),
                            lt: new Date(endUtcMs),
                        },
                    },
                    orderBy: [
                        { pri: 'asc' },
                        { time: 'asc' },
                        { id: 'asc' },
                    ],
                });

                const isOverdue = normalizedDate < todayKey;
                const isToday = normalizedDate === todayKey;
                const isFuture = normalizedDate > todayKey;

                const p1Count = tasks.filter((t) => t.pri === 1).length;
                const p2Count = tasks.filter((t) => t.pri === 2).length;
                const p3Count = tasks.filter((t) => t.pri === 3).length;
                const p4Count = tasks.filter((t) => t.pri === 4).length;

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

                const dateObj = new Date(Date.UTC(year, month - 1, day));
                const formattedDate = `${monthNames[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}, ${dateObj.getUTCFullYear()}`;

                let displayDate = `${dayNames[dateObj.getUTCDay()]}, ${formattedDate}`;
                if (normalizedDate === todayKey) {
                    displayDate = `Today • ${formattedDate}`;
                } else if (normalizedDate === yesterdayKey) {
                    displayDate = `Yesterday • ${formattedDate}`;
                }

                const dayEntry: DayWiseBacklog = {
                    date: normalizedDate,
                    displayDate,
                    isOverdue,
                    isToday,
                    isFuture,
                    totalTasks: tasks.length,
                    p1Count,
                    p2Count,
                    p3Count,
                    p4Count,
                    emoji,
                    statusLabel,
                    tasks: tasks.map((t) => ({
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

                // Fast count of total pending backlog for stats
                const totalPendingCount = await prisma.task.count({
                    where: { userId, done: false },
                });

                return {
                    pagination: {
                        page: 1,
                        limit: 1,
                        totalDays: tasks.length > 0 ? 1 : 0,
                        totalPages: 1,
                        hasNextPage: false,
                        hasPrevPage: false,
                    },
                    data: tasks.length > 0 ? [dayEntry] : [],
                    stats: {
                        totalBacklog: totalPendingCount,
                        overdueCount: isOverdue ? tasks.length : 0,
                        todayCount: isToday ? tasks.length : 0,
                        futureCount: isFuture ? tasks.length : 0,
                        p1Count,
                        p2Count,
                        p3Count,
                        p4Count,
                    },
                };
            }
        }

        // =========================================================================
        // CASE 2: INITIAL / PAGINATED FETCH -> FETCH ONLY FOR 3 DAYS
        // =========================================================================

        // Lightweight query: retrieve only timestamp & priority to determine unique backlog dates
        const pendingMeta = await prisma.task.findMany({
            where: {
                userId,
                done: false,
            },
            select: {
                time: true,
                pri: true,
            },
            orderBy: {
                time: 'asc',
            },
        });

        // Group into unique day keys in user's timezone
        const daySet = new Set<string>();
        let overdueCount = 0;
        let todayCount = 0;
        let futureCount = 0;
        let p1Count = 0;
        let p2Count = 0;
        let p3Count = 0;
        let p4Count = 0;

        for (const item of pendingMeta) {
            const taskTime = new Date(item.time);
            const adjustedTask = new Date(taskTime.getTime() - tzOffset * 60 * 1000);
            const dateKey = `${adjustedTask.getUTCFullYear()}-${String(adjustedTask.getUTCMonth() + 1).padStart(2, '0')}-${String(adjustedTask.getUTCDate()).padStart(2, '0')}`;

            daySet.add(dateKey);

            if (dateKey < todayKey) overdueCount++;
            else if (dateKey === todayKey) todayCount++;
            else futureCount++;

            if (item.pri === 1) p1Count++;
            else if (item.pri === 2) p2Count++;
            else if (item.pri === 3) p3Count++;
            else if (item.pri === 4) p4Count++;
        }

        let sortedDayKeys = Array.from(daySet).sort((a, b) => a.localeCompare(b));

        // Filter days by scope if requested
        if (scope === 'overdue') {
            sortedDayKeys = sortedDayKeys.filter((k) => k < todayKey);
        } else if (scope === 'upcoming') {
            sortedDayKeys = sortedDayKeys.filter((k) => k >= todayKey);
        }

        const totalDays = sortedDayKeys.length;
        const totalPages = Math.max(1, Math.ceil(totalDays / safeLimit));
        const currentPage = Math.min(safePage, totalPages);
        const offset = (currentPage - 1) * safeLimit;
        // Slice for exactly 3 days (or safeLimit)
        const pageDayKeys = sortedDayKeys.slice(offset, offset + safeLimit);

        if (pageDayKeys.length === 0) {
            return {
                pagination: {
                    page: currentPage,
                    limit: safeLimit,
                    totalDays,
                    totalPages,
                    hasNextPage: false,
                    hasPrevPage: currentPage > 1,
                },
                data: [],
                stats: {
                    totalBacklog: pendingMeta.length,
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

        // Calculate UTC boundaries spanning ONLY the 3 days on this page
        const firstParts = pageDayKeys[0].split('-').map(Number);
        const lastParts = pageDayKeys[pageDayKeys.length - 1].split('-').map(Number);

        const rangeStartUtcMs = Date.UTC(firstParts[0], firstParts[1] - 1, firstParts[2], 0, 0, 0) + (tzOffset * 60 * 1000);
        const rangeEndUtcMs = Date.UTC(lastParts[0], lastParts[1] - 1, lastParts[2], 0, 0, 0) + 24 * 60 * 60 * 1000 + (tzOffset * 60 * 1000);

        // Fetch FULL task details strictly for those 3 days
        const tasks = await prisma.task.findMany({
            where: {
                userId,
                done: false,
                time: {
                    gte: new Date(rangeStartUtcMs),
                    lt: new Date(rangeEndUtcMs),
                },
            },
            orderBy: [
                { pri: 'asc' },
                { time: 'asc' },
                { id: 'asc' },
            ],
        });

        // Group tasks into the 3 day entries
        const pageDayMap = new Map<string, typeof tasks>();
        for (const key of pageDayKeys) {
            pageDayMap.set(key, []);
        }

        for (const t of tasks) {
            const taskTime = new Date(t.time);
            const adjustedTask = new Date(taskTime.getTime() - tzOffset * 60 * 1000);
            const dateKey = `${adjustedTask.getUTCFullYear()}-${String(adjustedTask.getUTCMonth() + 1).padStart(2, '0')}-${String(adjustedTask.getUTCDate()).padStart(2, '0')}`;

            if (pageDayMap.has(dateKey)) {
                pageDayMap.get(dateKey)!.push(t);
            }
        }

        const days: DayWiseBacklog[] = pageDayKeys.map((key) => {
            const dayTasks = pageDayMap.get(key) || [];
            const totalTasks = dayTasks.length;
            const p1 = dayTasks.filter((t) => t.pri === 1).length;
            const p2 = dayTasks.filter((t) => t.pri === 2).length;
            const p3 = dayTasks.filter((t) => t.pri === 3).length;
            const p4 = dayTasks.filter((t) => t.pri === 4).length;

            const isOverdue = key < todayKey;
            const isToday = key === todayKey;
            const isFuture = key > todayKey;

            let emoji = "📋";
            let statusLabel = "Backlog";
            if (isOverdue) {
                emoji = p1 > 0 ? "🚨" : "⚠️";
                statusLabel = "Overdue Backlog";
            } else if (isToday) {
                emoji = "⚡";
                statusLabel = "Due Today";
            } else {
                emoji = "📅";
                statusLabel = "Upcoming";
            }

            const [y, m, d] = key.split('-').map(Number);
            const dateObj = new Date(Date.UTC(y, m - 1, d));
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
                p1Count: p1,
                p2Count: p2,
                p3Count: p3,
                p4Count: p4,
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
                totalBacklog: pendingMeta.length,
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
