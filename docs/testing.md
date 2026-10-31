# Testing strategy

Protect customer outcomes first: correct screenings, available seats, one booking per request, and private usable tickets. Prefer tests that fail when observable behavior breaks, rather than snapshots of classes, animation values, or internal state.

## Run locally

From the repository root:

```powershell
dotnet restore CinemaR.slnx --locked-mode
dotnet test CinemaR.slnx --no-restore
npm ci --prefix src/frontend
npm test --prefix src/frontend
npm run test:legacy --prefix src/frontend
npm run build --prefix src/frontend
```

Use `npm run test:watch --prefix src/frontend` while changing frontend behavior. Use `npm run test:coverage --prefix src/frontend` to produce a terminal summary, `src/frontend/coverage/index.html`, and LCOV for tooling. If a Windows sandbox blocks Vite's configuration bundler from reading parent directories, the build supports `-- --configLoader runner`; tests can use `npm test --prefix src/frontend -- --configLoader runner`.

The GitHub Actions workflow runs fast backend tests, PostgreSQL integration tests, frontend tests with coverage, existing regression scripts, and the TypeScript/production build on pushes and pull requests. Test results and coverage reports are uploaded as artifacts. Make all three jobs required checks in repository branch protection when enabling this workflow.

## PostgreSQL integration tests

Run the database suite separately from the fast solution tests:

```powershell
./scripts/test-postgres.ps1
./scripts/test-postgres.ps1 -Filter MigrationExecutionTests
```

The runner starts PostgreSQL 18 on a random loopback port and removes its disposable container when finished. Each test creates its own randomly named database, applies the committed migrations, and drops only that database. It never uses the application connection string or the developer's Compose database. Docker must be running. The project deliberately stays outside `CinemaR.slnx`, so the normal fast suite does not require Docker.

CI runs the same project in the separate `postgres` job with a PostgreSQL service. To use another **disposable** server, set `CINEMAR_TEST_POSTGRES` to a connection string for an account allowed to create databases, then run:

```powershell
dotnet restore src/backend/CinemaR.IntegrationTests/CinemaR.IntegrationTests.csproj --locked-mode
dotnet test src/backend/CinemaR.IntegrationTests/CinemaR.IntegrationTests.csproj --no-restore --configuration Release
```

The suite covers distinct production behaviors:

- Competing customers buying one seat, overlapping multi-seat selections, and rejection of foreign-auditorium seats without partial writes.
- Recovery of the same confirmation and ticket codes after screening start, and concurrent request-ID reuse across different screenings.
- Account-owned history rather than email-based claiming, plus rejection of replay under a different owner.
- Actual Identity sign-in cookies, customer denial from administrator endpoints, verified-email booking ownership, and forged expected-owner rejection.
- Email verification gating sign-in, single-use password reset and existing-session revocation, with real Identity tokens (email delivery itself is outside the test).
- Private uncached PNG ticket endpoints, missing-seat rejection, and revoked QR access after cancellation by an authenticated administrator.
- Cancelled tickets, retained booking history, booked-showtime and permanent layout protection, conflicting batches, and rollback after immediate seat deletion followed by a failed write.
- PostgreSQL's exclusion constraint, adjacent occupied intervals, and independent auditoriums.
- SQL date/genre/format filtering at both Kyiv daylight-saving boundaries.
- Empty initialization from the idempotent deployment script, script reapplication, legacy history/data upgrades, schema rollback/reapply, and refusal of ambiguous dual histories.
- Repeatable development seeding without altering custom bookings and layouts.

Frontend regression tests additionally exercise private-cache removal and in-flight request cancellation on sign-out, route authorization, safe sign-in return destinations, tab-scoped selection expiry, movie edits, auditorium replacement intent, batch showtime creation, and showtimes filter transitions. They use actual hooks, QueryClient and transport code, replacing browser/network boundaries rather than reimplementing the behavior in tests.

Two defects were reproduced and corrected while adding coverage: feature-first administration query keys escaped sign-out cleanup; a missing SQL statement terminator broke the idempotent deployment script. Historical migration IDs and data operations are unchanged; the migration edit only terminates the existing UPDATE statement inside the generated conditional block.

## Where tests belong

- **Frontend rules and interactions:** colocate `*.test.ts` / `*.test.tsx` beside the feature. Vitest imports actual TypeScript modules; React Testing Library renders hooks and components. Seat-selection tests use a fixed clock and cover the eight-seat limit, refreshed availability, and the server-adjusted start boundary. Seat-map component tests check accessible names, pressed state, and disabled interactions. Checkout tests use real query providers and API request serialization, replacing only `fetch` to simulate lost responses, server failures, conflicts, and duplicate submissions.
- **Application rules:** keep xUnit tests in `src/backend/CinemaR.Tests`, with small repository doubles in `Support`. These cover validation, calendar boundaries, command normalization, transaction orchestration, and cancellation. They are fast and do not need a database.
- **Schema compatibility:** `MigrationScriptTests` checks legacy history relocation before idempotent migration guards, rejects ambiguous histories, and verifies that the schema upgrade moves tables without dropping them. `ArchitectureTests` checks the EF snapshot and preserves historical migration IDs. Verify empty initialization, upgrades, and rollback/reapply against disposable PostgreSQL databases before changing migration history handling.
- **HTTP contracts:** `ApiTests` uses `WebApplicationFactory` with actual routing, model binding, validation, controllers, and booking application service. Only booking persistence is replaced; Data Protection uses isolated in-memory test keys. Tests run in Production to avoid Development startup migrations, and verify that administration and booking history require sign-in. They cover CSRF protection, expired/forged checkout identity, Problem Details, checkout conflict codes, validation, and private uncached confirmation errors. They do not verify persistence or readiness connectivity.
- **Existing regression scripts:** `test:legacy` explicitly lists the standalone Node checks. Keep them running while moving relevant cases to Vitest when touching those features. Prefer normal imports and real React rendering for new tests; avoid extending the custom transpiler/VM loaders. The write-enabled `check-admin-api.cjs` is separate and requires a disposable API/database.

## Remaining coverage to add

The PostgreSQL suite establishes the core persistence behaviors above. Extend it with deterministic cancellation/layout-replacement races against booking, same-request concurrent replay on one screening, changed-email/seat replay conflicts, and customer-history page-boundary ordering. These remain distinct gaps; the suite is not a load test or evidence of all possible interleavings. Make the `postgres` job a required check when configuring branch protection.

Add a small Playwright suite against the built frontend and an API backed by a disposable database. Cover showtimes → seat selection → checkout → confirmation → reload, a second customer taking a selected seat, and administrator access being allowed only after authorized sign-in. Add one narrow/mobile seat-layout check and one reduced-motion journey. Use a fixed fixture clock/catalog, accessible locators, and condition-based waits. Keep visual choreography and scroll behavior in browser checks rather than jsdom assertions.

## Rules for new changes

- For each behavior change, add a regression test at the lowest layer that can observe the failure. Add an HTTP or browser test when the boundary itself matters.
- Assert outcomes and error contracts, not private method calls. For async UI work, use `act` and Testing Library waits; use fake timers for explicit time boundaries instead of sleeping.
- Reset mocks, render trees, clocks, and query caches between tests. Never make tests depend on today's catalog dates or test execution order.
- Review coverage for untested decisions in changed code. Coverage is diagnostic; there is no blanket percentage gate while much of the UI remains uncovered. Prioritize booking safety and database guarantees over cosmetic coverage.
- A green fast suite is necessary but does not establish concurrent booking safety or browser layout correctness. Track those gaps until the integration and browser suites above are running.
