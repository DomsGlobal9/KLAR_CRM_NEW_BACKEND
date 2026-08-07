import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Records every query the repository issues so we can assert on how MANY were
 * sent, not just what came back. The whole point of v1.1.0 is call count.
 *
 * vi.hoisted() is required because vi.mock() is lifted to the top of the file,
 * above any normal const declaration it would otherwise reference.
 */
const { mockClient, state } = vi.hoisted(() => {
    const state: { nextRows: any[] } = { nextRows: [] };

    const mockClient = vi.fn((_strings: TemplateStringsArray, ..._values: any[]) =>
        Promise.resolve(state.nextRows)
    );

    return { mockClient, state };
});

vi.mock('../src/db/drizzle', () => ({
    client: mockClient,
    db: {},
}));

vi.mock('../src/config', () => ({
    supabase: { auth: {} },
    supabaseAdmin: { auth: { admin: {} } },
}));

import { AuthRepository } from '../src/repositories/auth.repository';

const USER_A = '11111111-1111-1111-1111-111111111111';
const USER_B = '22222222-2222-2222-2222-222222222222';
const USER_C = '33333333-3333-3333-3333-333333333333';

beforeEach(() => {

    state.nextRows = [];
    mockClient.mockClear();
    AuthRepository.invalidateUsernameCache();
});

describe('getUsernamesByIds — batching', () => {

    it('resolves many users in a SINGLE query (was one HTTPS call per user)', async () => {
        state.nextRows = [
            { id: USER_A, raw_user_meta_data: { username: 'alice' } },
            { id: USER_B, raw_user_meta_data: { username: 'bob' } },
            { id: USER_C, raw_user_meta_data: { username: 'carol' } },
        ];

        const result = await AuthRepository.getUsernamesByIds([USER_A, USER_B, USER_C]);

        expect(mockClient).toHaveBeenCalledTimes(1);
        expect(result.get(USER_A)).toBe('alice');
        expect(result.get(USER_B)).toBe('bob');
        expect(result.get(USER_C)).toBe('carol');
    });

    it('issues no query at all for an empty list', async () => {
        const result = await AuthRepository.getUsernamesByIds([]);

        expect(mockClient).not.toHaveBeenCalled();
        expect(result.size).toBe(0);
    });

    it('dedupes repeated ids so a 50-lead page with 3 owners queries 3 users', async () => {
        state.nextRows = [
            { id: USER_A, raw_user_meta_data: { username: 'alice' } },
            { id: USER_B, raw_user_meta_data: { username: 'bob' } },
        ];

        // Simulates a page of leads mostly assigned to the same two people.
        const manyIds = Array.from({ length: 50 }, (_, i) => (i % 2 ? USER_A : USER_B));

        await AuthRepository.getUsernamesByIds(manyIds);

        expect(mockClient).toHaveBeenCalledTimes(1);
    });

    it('falls back to full_name when username is absent', async () => {
        state.nextRows = [{ id: USER_A, raw_user_meta_data: { full_name: 'Alice Smith' } }];

        const result = await AuthRepository.getUsernamesByIds([USER_A]);

        expect(result.get(USER_A)).toBe('Alice Smith');
    });

    it('maps unknown or deleted users to null rather than throwing', async () => {
        state.nextRows = [];

        const result = await AuthRepository.getUsernamesByIds([USER_A]);

        expect(result.get(USER_A)).toBeNull();
    });

    it('returns nulls instead of throwing when the query fails', async () => {
        mockClient.mockImplementationOnce(() => Promise.reject(new Error('connection refused')));

        const result = await AuthRepository.getUsernamesByIds([USER_A]);

        // Degrades to a blank username — it must never break the whole request.
        expect(result.get(USER_A)).toBeNull();
    });

    it('ignores falsy ids (leads with no assignee)', async () => {
        state.nextRows = [{ id: USER_A, raw_user_meta_data: { username: 'alice' } }];

        const result = await AuthRepository.getUsernamesByIds(
            [USER_A, '', null as any, undefined as any]
        );

        expect(mockClient).toHaveBeenCalledTimes(1);
        expect(result.get(USER_A)).toBe('alice');
    });
});

describe('getUsernamesByIds — caching', () => {

    it('serves a repeat lookup from cache without querying again', async () => {
        state.nextRows = [{ id: USER_A, raw_user_meta_data: { username: 'alice' } }];

        await AuthRepository.getUsernamesByIds([USER_A]);
        expect(mockClient).toHaveBeenCalledTimes(1);

        const second = await AuthRepository.getUsernamesByIds([USER_A]);

        expect(mockClient).toHaveBeenCalledTimes(1); // still 1 — served from cache
        expect(second.get(USER_A)).toBe('alice');
    });

    it('queries only the ids that are not already cached', async () => {
        state.nextRows = [{ id: USER_A, raw_user_meta_data: { username: 'alice' } }];
        await AuthRepository.getUsernamesByIds([USER_A]);

        state.nextRows = [{ id: USER_B, raw_user_meta_data: { username: 'bob' } }];
        const result = await AuthRepository.getUsernamesByIds([USER_A, USER_B]);

        expect(mockClient).toHaveBeenCalledTimes(2);
        expect(result.get(USER_A)).toBe('alice'); // from cache
        expect(result.get(USER_B)).toBe('bob');   // from the second query
    });

    it('re-queries after the cache is invalidated', async () => {
        state.nextRows = [{ id: USER_A, raw_user_meta_data: { username: 'alice' } }];
        await AuthRepository.getUsernamesByIds([USER_A]);

        AuthRepository.invalidateUsernameCache(USER_A);

        state.nextRows = [{ id: USER_A, raw_user_meta_data: { username: 'alice-renamed' } }];
        const result = await AuthRepository.getUsernamesByIds([USER_A]);

        expect(mockClient).toHaveBeenCalledTimes(2);
        expect(result.get(USER_A)).toBe('alice-renamed');
    });
});

describe('getUsernameById — single lookup', () => {

    it('returns the username via the batch path', async () => {
        state.nextRows = [{ id: USER_A, raw_user_meta_data: { username: 'alice' } }];

        expect(await AuthRepository.getUsernameById(USER_A)).toBe('alice');
    });

    it('returns null for an empty id without querying', async () => {
        expect(await AuthRepository.getUsernameById('')).toBeNull();
        expect(mockClient).not.toHaveBeenCalled();
    });
});

describe('getUserByEmail — single indexed query', () => {

    it('finds a user in ONE query (was a full paginated scan)', async () => {
        state.nextRows = [{
            id: USER_A,
            email: 'alice@example.com',
            raw_user_meta_data: { username: 'alice', role_name: 'rm' },
        }];

        const { user, error } = await AuthRepository.getUserByEmail('alice@example.com');

        expect(mockClient).toHaveBeenCalledTimes(1);
        expect(error).toBeNull();
        expect(user?.id).toBe(USER_A);
        // Callers read user.user_metadata — that shape must be preserved.
        expect(user?.user_metadata.role_name).toBe('rm');
    });

    it('returns a null user, not an error, when the email is unknown', async () => {
        state.nextRows = [];

        const { user, error } = await AuthRepository.getUserByEmail('nobody@example.com');

        expect(user).toBeNull();
        expect(error).toBeNull();
    });

    it('reports an error object when the query fails', async () => {
        mockClient.mockImplementationOnce(() => Promise.reject(new Error('boom')));

        const { user, error } = await AuthRepository.getUserByEmail('alice@example.com');

        expect(user).toBeNull();
        expect(error?.message).toBe('boom');
    });
});
