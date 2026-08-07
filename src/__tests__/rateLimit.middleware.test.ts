import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../config', () => ({ supabase: {}, supabaseAdmin: {} }));

/**
 * Thresholds are read from env at import time and come from __tests__/setup.ts,
 * which runs before any module loads: API limit 5, auth limit 3.
 */
import { apiLimiter, authLimiter } from '../middleware/rateLimit.middleware';

/**
 * Builds an app whose requests are attributed to a given user, simulating what
 * the auth middleware would have set.
 */
const makeApiApp = () => {
    const app = express();
    app.use(express.json());

    app.use((req: any, _res, next) => {
        const userId = req.headers['x-test-user'];
        if (userId) req.user = { id: userId };
        next();
    });

    app.use(apiLimiter);
    app.get('/health', (_req, res) => { res.json({ ok: true }); });
    app.get('/thing', (_req, res) => { res.json({ ok: true }); });

    return app;
};

const makeAuthApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/login', authLimiter, (req, res) => {
        // Mirrors a real login: wrong password fails, correct one succeeds.
        if (req.body.password === 'correct') {
            res.json({ ok: true });
        } else {
            res.status(401).json({ error: 'bad credentials' });
        }
    });

    return app;
};

beforeEach(() => {
    // Each limiter keeps counters in memory; clear them between tests.
    (apiLimiter as any).resetKey?.('');
    (authLimiter as any).resetKey?.('');
});

describe('apiLimiter', () => {

    it('allows traffic up to the limit', async () => {
        const app = makeApiApp();

        for (let i = 0; i < 5; i++) {
            const res = await request(app).get('/thing').set('x-test-user', 'alice');
            expect(res.status).toBe(200);
        }
    });

    it('returns 429 with a JSON body once the limit is exceeded', async () => {
        const app = makeApiApp();

        for (let i = 0; i < 5; i++) {
            await request(app).get('/thing').set('x-test-user', 'bob');
        }

        const res = await request(app).get('/thing').set('x-test-user', 'bob');

        expect(res.status).toBe(429);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/too many requests/i);
    });

    it('counts each user separately, so one heavy user cannot lock out another', async () => {
        const app = makeApiApp();

        // Exhaust carol's budget.
        for (let i = 0; i < 6; i++) {
            await request(app).get('/thing').set('x-test-user', 'carol');
        }

        expect((await request(app).get('/thing').set('x-test-user', 'carol')).status).toBe(429);

        // This is the office-NAT case: dave shares carol's IP but must be
        // unaffected, because the key is the user id.
        expect((await request(app).get('/thing').set('x-test-user', 'dave')).status).toBe(200);
    });

    it('never throttles /health', async () => {
        const app = makeApiApp();

        for (let i = 0; i < 20; i++) {
            const res = await request(app).get('/health').set('x-test-user', 'erin');
            expect(res.status).toBe(200);
        }
    });

    it('advertises limit state via standard headers', async () => {
        const app = makeApiApp();

        const res = await request(app).get('/thing').set('x-test-user', 'frank');

        expect(res.headers['ratelimit']).toBeDefined();
        expect(res.headers['x-ratelimit-limit']).toBeUndefined(); // legacy off
    });
});

describe('authLimiter', () => {

    it('blocks repeated FAILED attempts against one account', async () => {
        const app = makeAuthApp();

        for (let i = 0; i < 3; i++) {
            const res = await request(app).post('/login').send({ email: 'a@x.com', password: 'wrong' });
            expect(res.status).toBe(401);
        }

        const blocked = await request(app).post('/login').send({ email: 'a@x.com', password: 'wrong' });

        expect(blocked.status).toBe(429);
        expect(blocked.body.error).toMatch(/too many attempts/i);
    });

    it('does not count successful logins', async () => {
        const app = makeAuthApp();

        // Ten good logins in a row must never trip the limiter.
        for (let i = 0; i < 10; i++) {
            const res = await request(app).post('/login').send({ email: 'b@x.com', password: 'correct' });
            expect(res.status).toBe(200);
        }
    });

    it('isolates accounts, so attacking one cannot lock out another', async () => {
        const app = makeAuthApp();

        for (let i = 0; i < 4; i++) {
            await request(app).post('/login').send({ email: 'victim@x.com', password: 'wrong' });
        }

        expect(
            (await request(app).post('/login').send({ email: 'victim@x.com', password: 'wrong' })).status
        ).toBe(429);

        // A different account on the same IP is untouched.
        expect(
            (await request(app).post('/login').send({ email: 'other@x.com', password: 'correct' })).status
        ).toBe(200);
    });

    it('treats email case and whitespace as the same account', async () => {
        const app = makeAuthApp();

        for (let i = 0; i < 3; i++) {
            await request(app).post('/login').send({ email: 'Case@X.com', password: 'wrong' });
        }

        // Varying case must not hand the attacker a fresh budget.
        const res = await request(app).post('/login').send({ email: '  case@x.com  ', password: 'wrong' });

        expect(res.status).toBe(429);
    });

    it('falls back to an IP key when no email is supplied', async () => {
        const app = makeAuthApp();

        for (let i = 0; i < 3; i++) {
            await request(app).post('/login').send({ password: 'wrong' });
        }

        const res = await request(app).post('/login').send({ password: 'wrong' });

        expect(res.status).toBe(429);
    });
});
