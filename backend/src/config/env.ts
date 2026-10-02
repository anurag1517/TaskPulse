import dotenv from "dotenv";
dotenv.config();

export const env = {
    port: Number(process.env.PORT || 5011),
    dbUrl: process.env.DATABASE_URL || "",
    log_level: process.env.LOG_LEVEL as string,
    key_expiry: (process.env.token_expiry) as any,
    userCookieName: process.env.USER_COOKIE_NAME as string,
    userJwtSecret: process.env.USER_JWT_SECRET as string,
    expire_cookie: Number(process.env.EXPIRE_COOKIE_MS),
    corsOrigin: process.env.CORS_ORIGIN as string,
    isProduction: process.env.NODE_ENV === "production",
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY as string,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY as string,
    vapidSubject: process.env.VAPID_SUBJECT as string,
    cronSecret: process.env.CRON_SECRET as string,
} as const;