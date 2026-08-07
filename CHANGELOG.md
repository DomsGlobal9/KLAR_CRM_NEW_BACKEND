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

---

## [1.2.0] — Fix Puppeteer memory leak and stop launching Chromium per request

**Problem.** Seven code paths across six services called `puppeteer.launch()` on
every PDF request. Two distinct faults:

1. **A permanent leak.** None of the call sites used `try/finally`. The
   `browser.close()` line sat after `page.pdf()`, so any throw — malformed HTML,
   a template error, a timeout — skipped it and orphaned a Chromium process
   holding 250–400 MB. Nothing ever reclaimed it. Over days of uptime this is a
   guaranteed OOM kill, and it was the single biggest obstacle to running 24/7.

2. **Cost per request.** Launching Chromium takes 1–3 seconds and several
   hundred megabytes. Doing that per request meant a handful of concurrent PDFs
   could outweigh everything else on the box.

**Changes.**

| File | Change |
| --- | --- |
| `services/pdf-browser.service.ts` | **New.** Owns one shared browser for the process. `renderPdf(html, options?)` always closes its page in a `finally` block. Relaunches transparently if Chromium dies, never caches a failed launch, and caps concurrent renders (`PDF_MAX_CONCURRENCY`, default 4) with a FIFO queue. |
| `services/invoicePdf.service.ts` | `generatePDF` → `renderPdf` |
| `services/itinerary-pdf.service.ts` | `generatePDFBuffer`, `generateBuffer` → `renderPdf` |
| `services/itinerary-quotePdf.ts` | `generatePDFBuffer` → `renderPdf` |
| `services/quote-pdf.service.ts` | `generateBuffer` → `renderPdf` |
| `services/voucher-pdf.service.ts` | `generateBuffer` → `renderPdf` |
| `services/leadStageInvoice-pdf.service.ts` | `generatePDFBuffer` → `renderPdf` |
| `services/leadStageVoucherPdf.service.ts` | `generateBuffer` → `renderPdf` |

**Effect.** Chromium launches once per process instead of once per request, and
a failed render can no longer leak one. Memory under sustained PDF load goes
from unbounded growth to flat.

**Compatibility.** No public signature changed — every service keeps its method
name and `Promise<Buffer>` return type. Page format and margins (A4,
`printBackground`, 15 mm) are unchanged; they were identical at all seven sites
and are now the shared default. Callers needing different options can pass them.

**New environment variables** (both optional):

- `PDF_MAX_CONCURRENCY` — simultaneous renders, default `4`
- `PDF_TIMEOUT_MS` — per-render timeout, default `60000`

**Tests.** 13 new, including the regression that matters: a render that throws
must still close its page. Also covers browser reuse, concurrent first-call
sharing, relaunch after crash, recovery from a failed launch, slot release on
failure, and the concurrency gate.

---

## [1.3.0] — Process resilience: crash handling and real graceful shutdown

**Problem.** `index.ts` had no `uncaughtException` or `unhandledRejection`
handler, so any unhandled rejection anywhere in the app terminated the whole API
with no diagnostic trail. `gracefulShutdown()` had an **empty body** — it closed
the HTTP server but released no Postgres pool, no Mongo connections, and no
Chromium process, then called `process.exit()`. Nothing logged on startup or
shutdown, so failures were invisible.

**Changes.**

| File | Change |
| --- | --- |
| `lifecycle.ts` | **New.** Ordered shutdown (server → Chromium → Postgres → Mongo), isolated per step so one hung resource cannot strand the others. Signal handlers, a hard shutdown deadline, and a re-entry guard. Kept separate from `index.ts` so it is testable without binding a port. |
| `index.ts` | Uses `registerProcessHandlers()`. Logs pid and port on startup. |
| `config/mongodbDatabase.config.ts` | New `closeDB()` — Mongo connections were never closed. |
| `ecosystem.config.js` | **New.** PM2 config with restart backoff, `min_uptime`, `max_memory_restart`, and a `kill_timeout` that exceeds the app's own shutdown deadline. |
| `package.json` | `pm2:start` now uses the ecosystem file; added `pm2:reload` for zero-downtime reloads. |

**Deliberate choice: `unhandledRejection` logs but does not exit.** Node's
default is to terminate the process. For a CRM that must stay available, one
request's forgotten `.catch()` should not sign every other user out. The
trade-off is that these are real bugs and the log line is now the only thing
surfacing them — watch for `[error] unhandledRejection` in `pm2 logs`.
`uncaughtException` still shuts down and exits 1, because the process state is
undefined at that point and a restart is the only safe response.

**Cluster mode is NOT enabled — this is intentional.** `instances` is 1.
Multi-instance would use all cores and is the next real capacity win, but two
pieces of state prevent it today:

1. `services/whatsapp.service.ts` uses `whatsapp-web.js` with `LocalAuth` on
   `./whatsapp-session`. Two instances would fight over that directory and
   corrupt the session.
2. `services/teamMember.service.ts` holds `pendingMemberCreations` in an
   in-process `Map`, invisible to other workers, so member invitations would
   fail depending on which worker served the follow-up request.

Both must move off local/in-process state before `instances` is raised.
`ecosystem.config.js` documents this inline.

**New environment variable.** `SHUTDOWN_TIMEOUT_MS` — how long to let in-flight
requests drain, default `15000`. Keep PM2's `kill_timeout` above it.

**Tests.** 8 new, covering close ordering, per-step failure isolation, exit-code
propagation, the repeated-signal guard, and the guarantee that shutdown never
rejects.

---

## [1.4.0] — Flatten nested N+1 queries

**Problem.** Several list endpoints built their response with a query per row,
and in two cases a query per row *of each row* — N + N×M round trips to render a
single page. Rendering 25 services with their categories and sub-services took
51 queries.

**Changes.**

| File | Was | Now |
| --- | --- | --- |
| `repositories/service.repository.ts` | `getAllServicesWithRelations`: 1 categories query per service | 2 queries total |
| `repositories/service.repository.ts` | `getAllServicesWithRelationsMinimal`: 1 per service **plus** 1 per category | 2 queries total |
| `repositories/service.repository.ts` | third variant: 1 categories query per service | 1 query total |
| `services/service.service.ts` | `getServiceHierarchy`: 1 per service + 1 per category | 2 queries total |
| `services/department.service.ts` | `listDepartments`: 3 lookups per department (30 for a 10-row page) | 3 queries total |
| `repositories/emailResponse.repository.ts` | `formatMessagesWithUserLookup`: 1 Auth API call per message | 1 query total |

New shared helper `fetchCategoryTreeByServiceIds()` loads the category and
sub-service tree for any number of services in at most two queries and groups
the rows in memory. Exposed as `serviceRepository.getCategoryTreeByServiceIds()`
so the service layer can build the same hierarchy without looping.

New `AuthRepository.getUserSummariesByIds()` resolves display name and email for
many users in one query — the same fix as v1.1.0's `getUsernamesByIds`, for the
call sites that need name and email rather than just a username.

**Note on the email "cache".** `formatMessagesWithUserLookup` held a `Map` that
looked like a per-request cache, but every item ran concurrently inside
`Promise.all`, so they all missed it and fired their requests simultaneously. It
only ever helped on a sequential re-check. That path now resolves the users it
needs up front, in one query.

**Compatibility.** Filtering (`is_active`) and ordering (`display_order`
ascending) match the original per-row queries exactly. Department enrichment
preserves each department's own id order and still drops ids that no longer
resolve. Name resolution order (`full_name` → `name` → `email` →
`'Team Member'`) is unchanged. Response bodies are byte-identical.

**Tests.** 8 new, asserting query *counts* rather than just results — including
that 25 services still cost 3 queries, that the sub-services query is skipped
when not requested, and that an empty input issues no queries at all.

---

## [1.5.0] — Rate limiting

**Problem.** The API had no rate limiting at all. A single script, or one
runaway retry loop in the frontend, could saturate the process and take the app
down for every user.

**Changes.**

| File | Change |
| --- | --- |
| `middleware/rateLimit.middleware.ts` | **New.** `apiLimiter` (general) and `authLimiter` (credential endpoints). |
| `app.ts` | `apiLimiter` mounted on `/api/v1`; added configurable `trust proxy`. |
| `routes/auth.routes.ts` | `authLimiter` on all login, OTP, registration, and password-reset endpoints. |

**Keyed by user, not IP — this matters here.** This is an internal CRM, so most
users sit behind one office NAT. A plain per-IP limit would treat the entire
office as one client and lock everyone out together. Requests are keyed by
authenticated user id, falling back to IP only for unauthenticated traffic.

**The auth limiter is keyed by the targeted email**, and counts only *failed*
attempts (`skipSuccessfulRequests`). That blunts credential stuffing and OTP
brute-forcing against a given account without penalising a user who signs in
repeatedly, and without letting one shared IP exhaust everyone's budget. Email
keys are lowercased and trimmed so varying case cannot buy a fresh budget.

**Deliberately not limited:**

- `/health` — a load balancer polling it must never consume a client's budget.
- `POST /refresh-token` — the frontend refreshes on a timer; throttling it would
  sign users out.

**⚠️ Deployment requirement.** If the app runs behind nginx, a load balancer, or
any reverse proxy, set `TRUST_PROXY` (usually `1`). Without it Express sees the
proxy's IP for every request, and unauthenticated traffic shares a single
bucket. Leave it unset when the app is directly exposed.

**New environment variables** (all optional, defaults shown):

- `TRUST_PROXY` — number of proxy hops; unset by default
- `RATE_LIMIT_WINDOW_MS` — `60000`
- `RATE_LIMIT_MAX` — `600` per window per user
- `AUTH_RATE_LIMIT_WINDOW_MS` — `900000`
- `AUTH_RATE_LIMIT_MAX` — `20` failed attempts per window per account

Limits are deliberately generous — the aim is to stop abuse and runaway loops,
not throttle normal use. The frontend polls ~4×/minute per user, far below the
general limit.

**Note.** Counters are in-process. With a single instance (see v1.3.0) that is
correct. If `instances` is ever raised, move the store to Redis or each worker
will enforce its own separate budget.

**New dependency.** `express-rate-limit`.

**Tests.** 10 new, driven through a real Express app via supertest: limit
enforcement, 429 shape, per-user isolation (the office-NAT case), `/health`
exemption, standard headers, failed-vs-successful auth attempts, per-account
isolation, email normalisation, and the no-email IP fallback.

---

## [1.6.0] — Remove the hardcoded user-count ceilings

**Problem.** Every "list all users" path capped silently — no error, no marker,
just missing rows. Past the cap a user simply stopped existing as far as the
~20 call sites that filter this list in memory were concerned. Duplicate-email
checks would pass wrongly, team-lead lookups would find nobody, round-robin lead
assignment would ignore most staff, and role listings would come back short.

Two different caps were in play:

- `listUsers({ page: 1, perPage: 1000 })` in four repositories — capped at 1000.
- **Bare `listUsers()`** in three more places — the Auth API default is **50**.

**Changes.**

| File | Was | Now |
| --- | --- | --- |
| `repositories/auth.repository.ts` | `listUsers()` capped at 1000 | One SQL query over `auth.users`, complete at any size |
| `repositories/auth.repository.ts` | — | New `findUserByMetadata()` — filters in the database instead of listing everyone and calling `.find()` |
| `repositories/teamMember.repository.ts` | capped at 1000; `findTLByTeam` scanned 1000 in memory | Delegates to `AuthRepository`; `findTLByTeam` filters in SQL |
| `repositories/team.repository.ts` | capped at 1000 | Delegates to `AuthRepository` |
| `repositories/user.repository.ts` | capped at 1000 | Delegates to `AuthRepository` |
| `repositories/department.repository.ts` | **capped at 50** | Delegates to `AuthRepository` |
| `repositories/teamLead.repository.ts` | **capped at 50** | Delegates to `AuthRepository` |
| `services/lead.service.ts` | **capped at 50** — round-robin only saw 50 accounts | Delegates to `AuthRepository` |

**Compatibility.** `listUsers()` returns the same `{ data: { users }, error }`
shape the Auth API produced, and each user keeps `id`, `email`,
`user_metadata`, `app_metadata`, `created_at`, `last_sign_in_at` and friends —
so none of the ~20 call sites needed changing. `user_metadata` is always an
object, never null, because callers read fields off it directly. On failure the
user list is `[]` rather than undefined, alongside the error.

**Performance note.** This is also faster: one query instead of up to 100 API
round trips at 100k users.

**Recommended index.** `findUserByMetadata()` uses JSONB containment. Add a GIN
index if user counts grow large:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_meta
  ON auth.users USING gin (raw_user_meta_data jsonb_path_ops);
```

**Not changed.** `config/supabase.config.ts` still calls the Auth API inside a
connection-test helper, but discards the result — it is a reachability probe,
not a listing.

**Tests.** 11 new, including the regression that matters: 2500 users are all
returned where the old cap silently dropped everything past 1000.
