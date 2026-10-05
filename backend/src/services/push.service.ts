import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import { env } from "../config/env";
import webpush from "web-push";

// Initialize VAPID if keys are available
if (env.vapidPublicKey && env.vapidPrivateKey) {
    try {
        webpush.setVapidDetails(
            env.vapidSubject || "mailto:admin@declutter.com",
            env.vapidPublicKey,
            env.vapidPrivateKey
        );
        console.log("[PushService] VAPID details configured successfully.");
    } catch (vapidErr) {
        console.error("[PushService] Error configuring VAPID details:", vapidErr);
    }
}

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

        console.log(`[PushService] Registered new push subscription for User ${userId}`);
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
        if (!subs || subs.length === 0) {
            console.log(`[PushService] User ${userId} has 0 registered push subscriptions. User must click 'Enable Notifications' in browser.`);
            return;
        }

        const notificationPayload = JSON.stringify(payload);

        for (const sub of subs) {
            try {
                if (env.vapidPublicKey && env.vapidPrivateKey) {
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
                    console.log(`[PushService] Successfully dispatched Web Push to User ${userId} (${sub.endpoint.slice(0, 35)}...)`);
                } else {
                    console.log(`[Push Notification simulated for User ${userId}]:`, payload.title, payload.body);
                }
            } catch (err: any) {
                console.error(`[PushService] Failed sending to endpoint for User ${userId}:`, err?.message || err);
                // If subscription expired / 410 Gone, remove from database
                if (err?.statusCode === 410 || err?.statusCode === 404) {
                    await prisma.pushSub.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
                }
            }
        }
    }
}

export const pushService = new PushService();
