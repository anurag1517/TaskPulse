import rateLimit from "express-rate-limit";

const make = (windowMs: number, limit: number, error: string, extra = {}) =>
    rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { error }, ...extra });

// anti-burst: no more than 20 requests in any 10-second window
export const burstLimiter = make(10_000, 20, "Slow down a little.");

// long window: 200 per 15 minutes
export const globalLimiter = make(15 * 60_000, 200, "Too many requests, try again later.");

// login/signup: 15 failed attempts per 15 minutes (successful logins don't count)
export const authLimiter = make(15 * 60_000, 5, "Too many attempts, wait 15 minutes.", {
    skipSuccessfulRequests: true,
});
