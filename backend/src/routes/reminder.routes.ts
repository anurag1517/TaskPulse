import { Router, Request, Response } from 'express';
import { env } from '../config/env';
import { reminderService } from '../services/reminder.service';

export const reminderRouter = Router();

// Health check endpoint for UptimeRobot / Cron-job.org keep-alive
reminderRouter.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Secure external cron webhook to trigger hourly reminders
reminderRouter.post('/trigger', async (req: Request, res: Response): Promise<void> => {
    const incomingSecret = req.headers['x-cron-secret'] || req.query.secret;

    if (!env.cronSecret || incomingSecret !== env.cronSecret) {
        res.status(401).json({
            error: 'Unauthorized: Invalid or missing cron secret',
        });
        return;
    }

    try {
        console.log('[ReminderWebhook] External cron triggered task reminder check...');
        await reminderService.checkAndSendReminders();
        res.status(200).json({
            success: true,
            message: 'Hourly task reminders executed successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[ReminderWebhook] Error executing reminders:', error);
        res.status(500).json({
            error: 'Failed to process reminders',
            details: error?.message,
        });
    }
});
