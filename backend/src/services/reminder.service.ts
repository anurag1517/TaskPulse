import { prisma } from "../lib/prisma";
import { pushService } from "./push.service";
import { logService } from "./log.service";

class ReminderService {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly ONE_HOUR_MS = 60 * 60 * 1000;

    async checkAndSendReminders(): Promise<void> {
        const now = Date.now();
        const oneHourAgo = BigInt(now - this.ONE_HOUR_MS);

        try {
            // Find all pending tasks where last reminder was sent more than an hour ago (or never)
            const pendingTasks = await prisma.task.findMany({
                where: {
                    done: false,
                    lastRem: {
                        lte: oneHourAgo,
                    },
                },
                include: {
                    user: {
                        select: { id: true, email: true },
                    },
                },
            });

            for (const task of pendingTasks) {
                // Priority-tailored reminder copy
                let urgencyTitle = `📌 Task Reminder: ${task.topic}`;
                let icon = "🔔";

                if (task.pri === 1) {
                    urgencyTitle = `🚨 URGENT P1 TASK: ${task.topic}!`;
                    icon = "🔥";
                } else if (task.pri === 2) {
                    urgencyTitle = `⚡ Priority P2: ${task.topic}`;
                    icon = "⏰";
                }

                const body = task.loc
                    ? `Pending at ${task.loc}. Time: ${new Date(task.time).toLocaleTimeString()}`
                    : `This task is pending completion. Please take action!`;

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
                    `Sent hourly reminder for P${task.pri} task: "${task.topic}"`,
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
