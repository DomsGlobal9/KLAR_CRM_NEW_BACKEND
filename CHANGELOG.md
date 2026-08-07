# Changelog

Performance and scalability hardening, worked as a series of independently
reviewable patches. Target capacity: 100,000 registered users / 3,000–5,000
concurrent.

Each version is a single commit on `perf/scalability-hardening`. Every patch
typechecks (`npm run typecheck`) and passes the test suite (`npm test`).

---

## [1.1.0] — Remove N+1 auth calls and per-request auth network round trip

**Problem.** The app slowed to a crawl at ~5 concurrent users.

Two causes, both remote HTTPS calls to the Supabase Auth API where a local or
batched lookup would do:

1. `AuthRepository.getUsernameById()` was called **once per lead** when building
   a list. It wraps `supabaseAdmin.auth.admin.getUserById()`, which is a network
   round trip — not a database query. A 50-lead page fired 50 concurrent
   requests at Supabase Auth. Five users on that screen produced ~250, which
   tripped rate limits and stalled the event loop.
2. `authenticate` called `supabase.auth.getUser()` on **every** request across
   30 of 34 route files, adding 100–300 ms of latency to every API call.

Separately, `getUserByEmail` / `getUserByUsername` paginated through the *entire*
user list to find one person. At 100k users that is up to 1,000 API calls for a
single lookup, and they run on every signup and password reset.

**Changes.**

| File | Change |
| --- | --- |
| `repositories/auth.repository.ts` | New `getUsernamesByIds()` — resolves any number of users in one SQL query against `auth.users`, with a 60 s in-process cache. `getUsernameById()` now delegates to it. |
| `repositories/auth.repository.ts` | `getUserByEmail()` — paginated scan replaced with one indexed query. |
| `repositories/lead.repository.ts` | Both N+1 loops (`getAllLeadsWithRequirements`, `getLeadsList`) now do one batched lookup per page. |
| `helpers/user.service.helper.ts` | `getUserByEmail()` / `getUserByUsername()` — full scans replaced with single queries. |
| `middleware/auth.middleware.ts` | Verified tokens cached for 60 s, keyed by SHA-256 hash, capped at 20,000 entries with eviction, never cached past the token's own `exp`. |
| `controllers/auth.controller.ts` | Logout invalidates the cached token immediately. |

**Effect.** Loading 50 leads: 51 HTTPS calls → 1 SQL query (0 when cached).
25 requests on one session: 25 auth round trips → 1.

**Compatibility.** No public signature changed. `getUsernamesByIdsSql()` is kept
as a deprecated alias. `formatAuthUserRow()` reproduces the exact object shape
`formatAuthUser()` returned, so callers cannot tell the difference.

**Trade-off.** A token revoked outside the app (e.g. deleted in the Supabase
dashboard) stays accepted for up to 60 s. Logout is handled explicitly via
`invalidateToken()`. Lower `TOKEN_CACHE_TTL_MS` to shrink that window.

**Deployment prerequisite.** The batch lookup reads `auth.users` over
`SUPABASE_DATABASE_URL`. Verify the role has access before deploying — if it
does not, usernames silently render blank. See `npm run verify:auth-access`.

**Also added.** Test infrastructure (`vitest.config.ts`, `src/__tests__/`) —
the project previously had none. 26 tests covering batching, deduping, caching,
invalidation, failure degradation, and every authentication rejection path.
