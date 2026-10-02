import { prisma } from "../lib/prisma";

class LogService {
    async addLog(userId: number, msg: string, icon: string = "📝") {
        const log = await prisma.log.create({
            data: {
                userId,
                msg,
                icon,
                ts: BigInt(Date.now()),
            },
        });

        return {
            ...log,
            ts: Number(log.ts),
        };
    }

    async getLogs(userId: number, limit: number = 100) {
        const logs = await prisma.log.findMany({
            where: { userId },
            orderBy: { ts: 'desc' },
            take: limit,
        });

        return logs.map((log) => ({
            ...log,
            ts: Number(log.ts),
        }));
    }

    async clearLogs(userId: number) {
        await prisma.log.deleteMany({
            where: { userId },
        });

        return { message: "Logs cleared successfully" };
    }
}

export const logService = new LogService();
