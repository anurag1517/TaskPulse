import { prisma } from "../lib/prisma";
import { pushService } from "./push.service";
import { logService } from "./log.service";

class ReminderService {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly ONE_HOUR_MS = 60 * 60 * 1000;

    async checkAndSendReminders(): Promise<void> {
        const now = Date.now();
        const oneHourAgo = BigInt(now - this.ONE_HOUR_MS);
        const tenMinsAgo = BigInt(now - 10 * 60 * 1000);

        try {
            // Find all pending tasks
            const pendingTasks = await prisma.task.findMany({
                where: {
                    done: false,
                },
                include: {
                    user: {
                        select: { id: true, email: true },
                    },
                },
            });

            for (const task of pendingTasks) {
                const taskTimeMs = new Date(task.time).getTime();
                const diffMinutes = Math.round((taskTimeMs - now) / (60 * 1000));
                const lastRemMs = Number(task.lastRem);

                // Case 1: Deadline is ending soon (within 15 minutes) or overdue within the last 30 minutes
                const isEndingSoon = diffMinutes <= 15 && diffMinutes >= -30;
                const recentDeadlineAlertSent = lastRemMs > Number(tenMinsAgo);

                // Case 2: Standard hourly reminder cycle for pending tasks
                const isHourlyCycleDue = lastRemMs === 0 || BigInt(lastRemMs) <= oneHourAgo;

                if (!isEndingSoon && !isHourlyCycleDue) {
                    continue;
                }

                if (isEndingSoon && recentDeadlineAlertSent) {
                    continue;
                }

                // Determine copy based on whether task is ending soon or routine hourly escalation
                let urgencyTitle = `📌 Task Reminder: ${task.topic}`;
                let icon = "🔔";

                if (isEndingSoon) {
                    if (diffMinutes > 0) {
                        urgencyTitle = `⏰ ENDING SOON: "${task.topic}" is due in ${diffMinutes}m!`;
                        icon = "⏳";
                    } else {
                        urgencyTitle = `🚨 DEADLINE PASSED: "${task.topic}" is overdue!`;
                        icon = "🔥";
                    }
                } else if (task.pri === 1) {
                    urgencyTitle = `🚨 URGENT P1 TASK: ${task.topic}!`;
                    icon = "🔥";
                } else if (task.pri === 2) {
                    urgencyTitle = `⚡ Priority P2: ${task.topic}`;
                    icon = "⏰";
                }

                const body = task.loc
                    ? `Location: ${task.loc}. Scheduled: ${new Date(task.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : `Scheduled for: ${new Date(task.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                console.log(`[ReminderService] Triggering alert for task "${task.topic}" [P${task.pri}] (due: ${diffMinutes}m)`);

                // Dispatch push notification
                await pushService.sendPushToUser(task.userId, {
                    title: urgencyTitle,
                    body,
                    icon,
                    data: {
                        taskId: task.id,
                        priority: task.pri,
                        topic: task.topic,
                    },
                });

                // Update last reminder timestamp
                await prisma.task.update({
                    where: { id: task.id },
                    data: {
                        lastRem: BigInt(now),
                    },
                });

                // Log the reminder event in daily activity log
                await logService.addLog(
                    task.userId,
                    `${urgencyTitle}: Scheduled for ${new Date(task.time).toLocaleTimeString()}`,
                    icon
                );
            }
        } catch (error) {
            console.error("[ReminderService] Error checking task reminders:", error);
        }
    }

    startScheduler(checkIntervalMs: number = 60 * 1000): void {
        if (this.intervalId) return;

        console.log(`[ReminderService] Started task reminder scheduler (checking every ${checkIntervalMs / 1000}s)`);
        // Initial run on startup
        this.checkAndSendReminders();

        this.intervalId = setInterval(() => {
            this.checkAndSendReminders();
        }, checkIntervalMs);
    }

    stopScheduler(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log("[ReminderService] Stopped task reminder scheduler");
        }
    }
}

export const reminderService = new ReminderService();
