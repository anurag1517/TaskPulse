import express from "express";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";

export function createApp() {
    const app = express();

    if (env.isProduction) {
        app.enable('trust proxy');
        app.use((req, res, next) => {
            if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
                return res.redirect(301, `https://${req.headers.host}${req.url}`);
            }
            next();
        });
    }

    app.use(express.json());
    app.use(cookieParser());
    const rawOrigins = (env.corsOrigin || "http://localhost:5173").includes(',')
        ? env.corsOrigin.split(',').map((origin) => origin.trim())
        : [env.corsOrigin ? env.corsOrigin.trim() : "http://localhost:5173"];
    const sanitizedOrigins = rawOrigins.map((origin) => origin.replace(/\/+$/, ''));

    app.use(cors({
        origin: sanitizedOrigins.length === 1 ? sanitizedOrigins[0] : sanitizedOrigins,
        credentials: true,
    }));
    app.use(express.urlencoded({
        extended: true
    }));
    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
    });
    app.use("/api", apiRouter);
    app.use(errorHandler);
    return app;
}