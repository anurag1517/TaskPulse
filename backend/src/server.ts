import { createApp } from "./app";
import { env } from "./config/env";
import { reminderService } from "./services/reminder.service";

const app = createApp();

const server = app.listen(env.port, () => {
    console.log(`[Declutter Server] Running on http://localhost:${env.port}`);
    console.log(`[Declutter Server] Environment: ${env.isProduction ? 'Production' : 'Development'}`);

    // Start hourly background reminder worker
    reminderService.startScheduler(60 * 1000); // Checks every minute for due hourly reminders
});

const gracefulShutdown = () => {
    console.log('[Declutter Server] Shutting down gracefully...');
    reminderService.stopScheduler();
    server.close(() => {
        console.log('[Declutter Server] Closed all HTTP connections.');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
