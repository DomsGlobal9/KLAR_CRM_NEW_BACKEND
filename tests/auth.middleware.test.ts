import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Counts calls to supabase.auth.getUser(). v1.1.0's goal is that this drops to
 * roughly one per token per cache window, instead of one per request.
 */
const { getUser, state } = vi.hoisted(() => {
    const state: { user: any; error: any } = {
        user: { id: 'user-1', email: 'alice@example.com', user_metadata: { role_name: 'rm' } },
        error: null,
    };

    const getUser = vi.fn(() =>
        Promise.resolve({ data: { user: state.user }, error: state.error })
    );

    return { getUser, state };
});

vi.mock('../src/config', () => ({
    supabase: { auth: { getUser } },
    supabaseAdmin: { auth: { admin: {} } },
}));

import { authenticate, invalidateToken, invalidateAllTokens } from '../src/middleware/auth.middleware';

/**
 * Builds a syntactically valid JWT with a real `exp` claim. The middleware
 * decodes (never trusts) this to cap how long a token may stay cached.
 */
const makeToken = (expSecondsFromNow: number, id = 'a'): string => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        sub: id,
        exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    })).toString('base64url');

    return `${header}.${payload}.signature-${id}`;
};

const mockReq = (token?: string): any => ({
    headers: token ? { authorization: `Bearer ${token}` } : {},
});

const mockRes = (): any => {
    const res: any = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};

beforeEach(() => {
    getUser.mockClear();
    state.user = { id: 'user-1', email: 'alice@example.com', user_metadata: { role_name: 'rm' } };
    state.error = null;
    invalidateAllTokens();
});

describe('authenticate — rejection cases (unchanged behaviour)', () => {

    it('401s when the Authorization header is missing', async () => {
        const res = mockRes();
        const next = vi.fn();

        await authenticate(mockReq(), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('401s when the header is not a Bearer token', async () => {
        const res = mockRes();
        const next = vi.fn();

        await authenticate({ headers: { authorization: 'Basic abc' } } as any, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('401s when Supabase rejects the token', async () => {
        state.user = null;
        state.error = { message: 'invalid token' };

        const res = mockRes();
        const next = vi.fn();

        await authenticate(mockReq(makeToken(3600)), res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('never caches a rejected token', async () => {
        state.user = null;
        state.error = { message: 'invalid token' };

        const token = makeToken(3600);

        await authenticate(mockReq(token), mockRes(), vi.fn());
        await authenticate(mockReq(token), mockRes(), vi.fn());

        // Both attempts must hit Supabase — a bad token must not be memoised.
        expect(getUser).toHaveBeenCalledTimes(2);
    });
});

describe('authenticate — populates req.user identically to before', () => {

    it('sets id, email, role and spreads metadata', async () => {
        state.user = {
            id: 'user-9',
            email: 'bob@example.com',
            user_metadata: { role_name: 'tl', username: 'bob', department: 'sales' },
        };

        const req = mockReq(makeToken(3600, 'b'));
        const next = vi.fn();

        await authenticate(req, mockRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.user.id).toBe('user-9');
        expect(req.user.email).toBe('bob@example.com');
        expect(req.user.role).toBe('tl');
        expect(req.user.username).toBe('bob');
        expect(req.user.department).toBe('sales');
    });

    it('tolerates a user with no metadata', async () => {
        state.user = { id: 'user-3', email: 'c@example.com', user_metadata: null };

        const req = mockReq(makeToken(3600, 'c'));
        const next = vi.fn();

        await authenticate(req, mockRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.user.id).toBe('user-3');
        expect(req.user.role).toBeUndefined();
    });
});

describe('authenticate — token caching', () => {

    it('verifies with Supabase once, then serves repeat requests from cache', async () => {
        const token = makeToken(3600);

        for (let i = 0; i < 25; i++) {
            const req = mockReq(token);
            const next = vi.fn();

            await authenticate(req, mockRes(), next);

            expect(next).toHaveBeenCalled();
            expect(req.user.id).toBe('user-1');
        }

        // 25 requests, 1 network call.
        expect(getUser).toHaveBeenCalledTimes(1);
    });

    it('verifies each distinct token separately', async () => {
        await authenticate(mockReq(makeToken(3600, 'a')), mockRes(), vi.fn());
        await authenticate(mockReq(makeToken(3600, 'b')), mockRes(), vi.fn());

        expect(getUser).toHaveBeenCalledTimes(2);
    });

    it('re-verifies after the token is invalidated (logout)', async () => {
        const token = makeToken(3600);

        await authenticate(mockReq(token), mockRes(), vi.fn());
        expect(getUser).toHaveBeenCalledTimes(1);

        invalidateToken(token);

        await authenticate(mockReq(token), mockRes(), vi.fn());
        expect(getUser).toHaveBeenCalledTimes(2);
    });

    it('does not cache a token that is already past its own exp', async () => {
        // exp in the past → the cache entry expires the moment it is written.
        const expiredToken = makeToken(-10, 'expired');

        await authenticate(mockReq(expiredToken), mockRes(), vi.fn());
        await authenticate(mockReq(expiredToken), mockRes(), vi.fn());

        // Supabase stays the authority on expiry — we must ask it every time.
        expect(getUser).toHaveBeenCalledTimes(2);
    });

    it('still works for a token whose payload cannot be decoded', async () => {
        const req = mockReq('not-a-real-jwt');
        const next = vi.fn();

        await authenticate(req, mockRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.user.id).toBe('user-1');
    });
});
