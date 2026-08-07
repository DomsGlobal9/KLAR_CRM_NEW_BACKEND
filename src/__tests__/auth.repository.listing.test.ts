import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockClient, state } = vi.hoisted(() => {
    const state: { nextRows: any[]; shouldFail: boolean } = {
        nextRows: [],
        shouldFail: false,
    };

    const mockClient = vi.fn((_strings: TemplateStringsArray, ..._values: any[]) => {
        if (state.shouldFail) return Promise.reject(new Error('connection lost'));
        return Promise.resolve(state.nextRows);
    });

    return { mockClient, state };
});

vi.mock('../db/drizzle', () => ({ client: mockClient, db: {} }));
vi.mock('../config', () => ({
    supabase: { auth: {} },
    supabaseAdmin: { auth: { admin: {} } },
}));

import { AuthRepository } from '../repositories/auth.repository';

const makeRow = (i: number) => ({
    id: `user-${i}`,
    email: `user${i}@example.com`,
    raw_user_meta_data: { username: `user${i}`, role_name: 'rm' },
    raw_app_meta_data: {},
    last_sign_in_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    phone: null,
    banned_until: null,
});

beforeEach(() => {
    state.nextRows = [];
    state.shouldFail = false;
    mockClient.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('listUsers — the 1000-user ceiling', () => {

    it('returns MORE than 1000 users (the old cap silently truncated here)', async () => {
        state.nextRows = Array.from({ length: 2500 }, (_, i) => makeRow(i));

        const { data, error } = await AuthRepository.listUsers();

        expect(error).toBeNull();
        expect(data.users).toHaveLength(2500);

        // The user that used to vanish.
        expect(data.users.find((u: any) => u.id === 'user-1500')).toBeDefined();
    });

    it('fetches everything in a single query regardless of user count', async () => {
        state.nextRows = Array.from({ length: 5000 }, (_, i) => makeRow(i));

        await AuthRepository.listUsers();

        // Paginating the Auth API would have been 5 calls at 1000/page.
        expect(mockClient).toHaveBeenCalledTimes(1);
    });

    it('preserves the Auth API response shape so callers need no changes', async () => {
        state.nextRows = [makeRow(1)];

        const { data } = await AuthRepository.listUsers();
        const user = data.users[0];

        expect(user.id).toBe('user-1');
        expect(user.email).toBe('user1@example.com');
        // Callers read user_metadata, not raw_user_meta_data.
        expect(user.user_metadata.username).toBe('user1');
        expect(user.user_metadata.role_name).toBe('rm');
        expect(user).toHaveProperty('app_metadata');
        expect(user).toHaveProperty('created_at');
        expect(user).toHaveProperty('last_sign_in_at');
    });

    it('gives every user a metadata object, even when the column is null', async () => {
        state.nextRows = [{ ...makeRow(1), raw_user_meta_data: null, raw_app_meta_data: null }];

        const { data } = await AuthRepository.listUsers();

        // ~20 call sites do `u.user_metadata || {}` then read fields; undefined
        // here would be a crash waiting to happen.
        expect(data.users[0].user_metadata).toEqual({});
        expect(data.users[0].app_metadata).toEqual({});
    });

    it('returns an empty user list plus an error rather than throwing', async () => {
        state.shouldFail = true;

        const { data, error } = await AuthRepository.listUsers();

        // Callers destructure data.users directly — it must never be undefined.
        expect(data.users).toEqual([]);
        expect(error?.message).toBe('connection lost');
    });

    it('handles an empty database', async () => {
        state.nextRows = [];

        const { data, error } = await AuthRepository.listUsers();

        expect(data.users).toEqual([]);
        expect(error).toBeNull();
    });
});

describe('findUserByMetadata', () => {

    it('finds a match in one query instead of scanning every user', async () => {
        state.nextRows = [makeRow(7)];

        const user = await AuthRepository.findUserByMetadata({
            role_name: 'tl',
            team_id: 'team-1',
        });

        expect(mockClient).toHaveBeenCalledTimes(1);
        expect(user.id).toBe('user-7');
    });

    it('returns null when nothing matches', async () => {
        state.nextRows = [];

        expect(await AuthRepository.findUserByMetadata({ role_name: 'tl' })).toBeNull();
    });

    it('returns null without querying when given no usable criteria', async () => {
        expect(await AuthRepository.findUserByMetadata({})).toBeNull();
        expect(mockClient).not.toHaveBeenCalled();
    });

    it('ignores null criteria values', async () => {
        state.nextRows = [];

        await AuthRepository.findUserByMetadata({
            role_name: 'tl',
            team_id: null as any,
        });

        expect(mockClient).toHaveBeenCalledTimes(1);
    });

    it('returns null instead of throwing when the query fails', async () => {
        state.shouldFail = true;

        expect(await AuthRepository.findUserByMetadata({ role_name: 'tl' })).toBeNull();
    });
});
