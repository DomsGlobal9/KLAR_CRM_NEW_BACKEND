# P06 — Automated Test Foundation

| Field | Value |
| --- | --- |
| **Patch ID** | P06 |
| **Version** | 1.7.1 |
| **Repository** | KLAR_CRM_NEW_BACKEND |
| **Branch** | `fix/qa-p06-test-foundation` |
| **Baseline SHA** | `5374a2ebd4305befd6c4b49c850cd87d6f8ac7fc` |
| **Risk** | LOW |
| **Database migration** | NO |
| **Deployment status** | WAITING FOR DEVELOPER APPROVAL |

---

## Objective

Ensure the repository contains a committed, runnable automated test suite, so
every subsequent security patch can ship with the tests the remediation
programme requires.

## Why the change was necessary

`.gitignore` contained:

```
# Test files
src/__tests__/
```

Consequence: **the entire test suite was excluded from the repository.** A clone
of this repo contained zero tests. CI had nothing to run, and no other developer
could execute or review them.

Commit `5374a2e "chore: ignore test files"` acted on that rule and deleted all
nine test files (1,451 lines) from Git. They existed only on one machine.

This blocks the remediation programme outright: the governing rule is *"A patch
without new or updated tests is incomplete"*, which is impossible to satisfy
while the test directory is ignored.

## Sequencing note

The remediation document lists this as Patch 06, but it was executed **first**.
The document permits reordering where *"fresh code inspection proves a dependency
requires a safer ordering"* — every other patch requires committed tests, so
this is a hard prerequisite rather than a preference.

## What changed

| File | Change |
| --- | --- |
| `tests/` (9 files) | Restored from commit `6dcc65a` and relocated from `src/__tests__/`. Import paths rewritten (`../x` → `../src/x`). |
| `.gitignore` | Removed the `src/__tests__/` rule. Replaced with ignores for test **output** (`coverage/`, `.vitest/`, `test-results/`) and local scratch files only, plus a comment recording why. |
| `vitest.config.ts` | `include` and `setupFiles` repointed to `tests/`. |
| `tsconfig.test.json` | **New.** Typecheck-only config spanning `src` **and** `tests`. |
| `package.json` | `typecheck` now uses `tsconfig.test.json`; added `typecheck:src` and `test:ci`. Version → 1.7.1. |

### Why `tests/` rather than `src/__tests__/`

Chosen by the developer. It satisfies both constraints at once: the suite is
tracked in Git, and the existing preference for keeping test files out of `src/`
is respected. It also has a real benefit — `tsconfig.json` has
`rootDir: "src"`, so tests no longer compile into `dist/`. Previously
`dist/__tests__/*.test.js` shipped to production.

### Typecheck coverage preserved

While the suite lived under `src/`, it was typechecked by the main config.
Moving it to `tests/` would have silently dropped that. `tsconfig.test.json`
restores it — `npm run typecheck` covers both trees, while `npm run build`
still emits `src` only.

## What was deliberately NOT changed

- No test was rewritten, retitled, or weakened — all nine are byte-identical
  restorations apart from import paths.
- No production source file was touched.
- No CI system was introduced; `npm run test:ci` is provided for whenever one
  is added.

## Tests

No new tests. This patch restores 85 existing ones:

| Suite | Tests |
| --- | --- |
| `auth.repository.test.ts` | 15 |
| `auth.repository.listing.test.ts` | 11 |
| `auth.middleware.test.ts` | 11 |
| `pdf-browser.service.test.ts` | 13 |
| `lifecycle.test.ts` | 8 |
| `service.repository.test.ts` | 8 |
| `rateLimit.middleware.test.ts` | 10 |
| `cron.test.ts` | 9 |
| **Total** | **85** |

## Test results

| Gate | Result |
| --- | --- |
| Typecheck (`src` + `tests`) | PASS |
| Build | PASS |
| Unit / integration | PASS — 85/85, 8 files |
| Security regression | N/A this patch |
| Regression | PASS — no production source modified |
| `dist/` free of test files | PASS |
| `tests/` tracked by Git | PASS (`git check-ignore` returns nothing) |

## Security review — PASS

No production code path changed. Improves security posture indirectly: shipping
`dist/__tests__/*.js` to production previously exposed test fixtures and mock
structure, which this removes.

No secrets are committed. `tests/setup.ts` contains only dummy values pointing at
`.invalid` hostnames (a reserved TLD that cannot resolve), and stubs nodemailer
so no test can send mail.

## CTO review — PASS

- Second source of truth? No — one suite, one location.
- Coupling? Unchanged.
- Scaling? Unaffected.
- Hidden behaviour change? No production code touched.
- Migration dependency? None.
- Rollback safe? Yes — revert restores the previous (broken) state exactly.
- Concurrency/data loss risk? None.

One risk accepted: `tests/` sits outside `rootDir`, so a stray `import` from
`src/` into `tests/` would fail the build. That is the desired direction of
dependency and the build enforces it.

## QC review — PASS

- Happy path: `npm test` → 85 pass.
- Negative path: `git check-ignore tests/setup.ts` → no match.
- Boundary: clean `dist` rebuild contains no `.test.js`.
- API compatibility: unchanged — no runtime code modified.
- Frontend compatibility: unaffected.
- Database side effects: none.

## Migration impact

None.

## Rollback

```bash
git revert <patch-sha>
```

Restores `.gitignore` and removes `tests/`. No data, schema, or runtime impact.

## Known follow-up items

1. No CI pipeline exists — `npm run test:ci` is unused until one is added.
2. Coverage is limited to the v1.1.0–v1.7.0 changes. No tests yet cover leads,
   quotes, invoices, itineraries, or teams. The critical-workflow smoke suite
   required by the remediation document remains outstanding.
3. Integration and API-level tests (against a live test database) are not yet
   present; current tests are unit-level with mocked I/O.

## Developer approval

**PENDING**
