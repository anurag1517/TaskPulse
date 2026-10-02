import { Router } from "express";
import { authRouter } from "./auth.routes";
import taskRouter from "./task.routes";
import logRouter from "./log.routes";
import pushRouter from "./push.routes";
import { reminderRouter } from "./reminder.routes";
import { authLimiter } from "../middleware/rateLimiter";

export const apiRouter = Router();

apiRouter.use("/auth", authLimiter, authRouter);
apiRouter.use("/task", taskRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/logs", logRouter);
apiRouter.use("/push", pushRouter);
apiRouter.use("/reminders", reminderRouter);