import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';
import type { AuthRequest } from './auth.middleware';

/**
 * Rate limiting.
 *
 * The API previously had none, so a single script — or one runaway retry loop in
 * the frontend — could saturate the process and take the app down for everyone.
 *
 * ---------------------------------------------------------------------------
 * WHY WE KEY ON USER ID, NOT IP
 * ---------------------------------------------------------------------------
 * This is an internal CRM. Most users sit behind one office NAT, so a plain
 * per-IP limit would count the whole office as a single client and lock
 * everyone out at once. Requests are therefore keyed by authenticated user id
 * where available, falling back to IP only for unauthenticated traffic.
 *
 * IMPORTANT: if this runs behind nginx, a load balancer, or any reverse proxy,
 * `TRUST_PROXY` must be set (see app.ts). Without it every request appears to
 * come from the proxy's own IP and the unauthenticated limits become a shared
 * bucket for all clients.
 */

/**
 * Limits are deliberately generous. The goal is to stop abuse and runaway
 * loops, not to throttle normal use. The frontend currently polls roughly four
 * times a minute per user, so a legitimate session sits far below these.
 */
const API_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const API_MAX = Number(process.env.RATE_LIMIT_MAX) || 600;

const AUTH_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60_000;
const AUTH_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX) || 20;

/**
 * Prefer the authenticated user id; fall back to a normalised IP key.
 *
 * ipKeyGenerator() is used rather than req.ip directly because it collapses
 * IPv6 addresses to their /64 prefix — without it, a client with an IPv6 range
 * can trivially sidestep the limit by varying the low bits.
 */
const userOrIpKey = (req: Request): string => {
    const userId = (req as AuthRequest).user?.id;

    return userId ? `user:${userId}` : `ip:${ipKeyGenerator(req.ip ?? '')}`;
};

const tooManyRequests = (_req: Request, res: Response) => {
    res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down and try again shortly.',
    });
};

/**
 * General API limiter. Mounted on /api/v1.
 */
export const apiLimiter = rateLimit({
    windowMs: API_WINDOW_MS,
    limit: API_MAX,
    keyGenerator: userOrIpKey,
    handler: tooManyRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Health checks must never be throttled — a process manager or load
    // balancer polling /health should not consume a client's budget.
    skip: req => req.path === '/health',
});

/**
 * Strict limiter for credential endpoints (login, OTP, password reset).
 *
 * Keyed by the account being targeted rather than the caller's IP. That is the
 * behaviour we actually want here: it blunts credential stuffing against a
 * given account without letting one office IP exhaust the budget for everyone
 * sharing it. Falls back to IP when no email is supplied.
 *
 * Only failed attempts count, so a user legitimately signing in repeatedly is
 * never penalised.
 */
export const authLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    limit: AUTH_MAX,
    keyGenerator: (req: Request) => {
        const email = typeof req.body?.email === 'string'
            ? req.body.email.toLowerCase().trim()
            : null;

        return email ? `email:${email}` : `ip:${ipKeyGenerator(req.ip ?? '')}`;
    },
    handler: (_req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            error: 'Too many attempts. Please wait a few minutes and try again.',
        });
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
