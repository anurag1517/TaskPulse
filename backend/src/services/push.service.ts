import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import { env } from "../config/env";

class PushService {
    async subscribe(userId: number, endpoint: string, p256dh: string, auth: string) {
        const sub = await prisma.pushSub.upsert({
            where: { endpoint },
            update: {
                userId,
                p256dh,
                auth,
            },
            create: {
                userId,
                endpoint,
                p256dh,
                auth,
            },
        });

        return sub;
    }

    async unsubscribe(userId: number, endpoint: string) {
        await prisma.pushSub.deleteMany({
            where: {
                userId,
                endpoint,
            },
        });

        return { message: "Unsubscribed successfully" };
    }

    async getSubscriptions(userId: number) {
        return prisma.pushSub.findMany({
            where: { userId },
        });
    }

    async sendPushToUser(
        userId: number,
        payload: { title: string; body: string; icon?: string; data?: any }
    ) {
        const subs = await this.getSubscriptions(userId);
        if (!subs || subs.length === 0) return;

        let webpush: any = null;
        try {
            webpush = require("web-push");
            if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
                webpush.setVapidDetails(
                    process.env.VAPID_SUBJECT || "mailto:admin@taskpulse.com",
                    process.env.VAPID_PUBLIC_KEY,
                    process.env.VAPID_PRIVATE_KEY
                );
            }
        } catch {
            // web-push not yet installed or VAPID keys not configured
        }

        const notificationPayload = JSON.stringify(payload);

        for (const sub of subs) {
            try {
                if (webpush && process.env.VAPID_PUBLIC_KEY) {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        notificationPayload
                    );
                } else {
                    console.log(`[Push Notification simulated for User ${userId}]:`, payload.title, payload.body);
                }
            } catch (err: any) {
                // If subscription expired / 410 Gone, remove from database
                if (err?.statusCode === 410 || err?.statusCode === 404) {
                    await prisma.pushSub.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
                }
            }
        }
    }
}

export const pushService = new PushService();
