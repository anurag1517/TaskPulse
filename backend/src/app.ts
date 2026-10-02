import express from "express";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { burstLimiter, globalLimiter } from "./middleware/rateLimiter";
import { notFound } from "./middleware/notFound";
import helmet from "helmet";

export function createApp() {
    const app = express();
    app.set("trust proxy", 1);

    app.get("/health", (_req, res) =>
        res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() }));

    if (env.isProduction) {
        app.use((req, res, next) =>
            req.secure ? next() : res.redirect(308, `https://${req.headers.host}${req.originalUrl}`));
    }

    const allowedOrigins = (env.corsOrigin || "http://localhost:5173")
        .split(",").map(o => o.trim().replace(/\/+$/, "")).filter(Boolean);

    app.use(helmet());
    app.use(cors({ origin: allowedOrigins, credentials: true }));
    app.use("/api", burstLimiter, globalLimiter);
    app.use(express.json({ limit: "20kb" }));
    app.use(cookieParser());
    app.use("/api", apiRouter);
    app.use(notFound);
    app.use(errorHandler);
    return app;
}