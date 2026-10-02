import { createApp } from "./app";
import { env } from "./config/env";
import { reminderService } from "./services/reminder.service";

const app = createApp();

const server = app.listen(env.port, () => {
    console.log(`[TaskPulse Server] Running on http://localhost:${env.port}`);
    console.log(`[TaskPulse Server] Environment: ${env.isProduction ? 'Production' : 'Development'}`);

    // Start hourly background reminder worker
    reminderService.startScheduler(60 * 1000); // Checks every minute for due hourly reminders
});

const gracefulShutdown = () => {
    console.log('[TaskPulse Server] Shutting down gracefully...');
    reminderService.stopScheduler();
    server.close(() => {
        console.log('[TaskPulse Server] Closed all HTTP connections.');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
