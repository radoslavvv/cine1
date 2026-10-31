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

The GitHub Actions workflow runs backend tests, frontend tests with coverage, existing regression scripts, and the TypeScript/production build on pushes and pull requests. Test results and coverage reports are uploaded as artifacts. Make both jobs required checks in repository branch protection when enabling this workflow.

## Where tests belong

- **Frontend rules and interactions:** colocate `*.test.ts` / `*.test.tsx` beside the feature. Vitest imports actual TypeScript modules; React Testing Library renders hooks and components. Seat-selection tests use a fixed clock and cover the eight-seat limit, refreshed availability, and the server-adjusted start boundary. Seat-map component tests check accessible names, pressed state, and disabled interactions. Checkout tests use real query providers and API request serialization, replacing only `fetch` to simulate lost responses, server failures, conflicts, and duplicate submissions.
- **Application rules:** keep xUnit tests in `src/backend/CinemaR.Tests`, with small repository doubles in `Support`. These cover validation, calendar boundaries, command normalization, transaction orchestration, and cancellation. They are fast and do not need a database.
- **Schema compatibility:** `MigrationScriptTests` checks legacy history relocation before idempotent migration guards, rejects ambiguous histories, and verifies that the schema upgrade moves tables without dropping them. `ArchitectureTests` checks the EF snapshot and preserves historical migration IDs. Verify empty initialization, upgrades, and rollback/reapply against disposable PostgreSQL databases before changing migration history handling.
- **HTTP contracts:** `ApiTests` uses `WebApplicationFactory` with actual routing, model binding, validation, controllers, and booking application service. Only booking persistence is replaced; Data Protection uses isolated in-memory test keys. Tests run in Production to avoid Development startup migrations, and verify that administration and booking history require sign-in. They cover CSRF protection, expired/forged checkout identity, Problem Details, checkout conflict codes, validation, and private uncached confirmation errors. They do not verify persistence or readiness connectivity.
- **Existing regression scripts:** `test:legacy` explicitly lists the standalone Node checks. Keep them running while moving relevant cases to Vitest when touching those features. Prefer normal imports and real React rendering for new tests; avoid extending the custom transpiler/VM loaders. The write-enabled `check-admin-api.cjs` is separate and requires a disposable API/database.

## Next coverage to add

The largest remaining gap is persistence. Create a separate PostgreSQL integration suite using a disposable PostgreSQL 18 container per run, apply the committed migrations, and insert a small fixed catalog. Use a separate database for each isolated fixture and never use the developer's Compose database. Keep Development catalog expansion out of normal fixture setup.

Prioritize these real-database assertions:

1. Two independent contexts concurrently booking the same seat produce exactly one confirmation; the loser gets `SeatsTaken` and creates no partial booking.
2. Replaying an identical request ID returns the same confirmation and ticket codes, including after showtime start. Reusing that ID with different seats, email, or showtime returns `RequestConflict`.
3. Booking multiple seats is atomic; one occupied or foreign-auditorium seat prevents every write.
4. The exclusion constraint rejects overlapping screenings in one auditorium but allows adjacent occupied intervals and simultaneous screenings in different auditoriums.
5. Kyiv date filtering spans the spring and autumn clock changes correctly in actual SQL, and cancelled/archived records follow the public visibility rules.
6. Migrations work on an empty database; seeding twice preserves bookings, layouts, and catalog counts.

Use PostgreSQL for these checks: repository doubles and EF model tests cannot prove locking, transactions, SQL translation, uniqueness, or exclusion constraints. SQLite and EF InMemory cannot substitute for those PostgreSQL guarantees. Add the database job as a required check once this suite exists; the current workflow does not claim that coverage.

After persistence, add a small Playwright suite against the built frontend and an API backed by that disposable database. Cover showtimes → seat selection → checkout → confirmation → reload, a second customer taking a selected seat, and administrator access being allowed only after authorized sign-in. Add one narrow/mobile seat-layout check and one reduced-motion journey. Use a fixed fixture clock/catalog, accessible locators, and condition-based waits. Keep visual choreography and scroll behavior in browser checks rather than jsdom assertions.

## Rules for new changes

- For each behavior change, add a regression test at the lowest layer that can observe the failure. Add an HTTP or browser test when the boundary itself matters.
- Assert outcomes and error contracts, not private method calls. For async UI work, use `act` and Testing Library waits; use fake timers for explicit time boundaries instead of sleeping.
- Reset mocks, render trees, clocks, and query caches between tests. Never make tests depend on today's catalog dates or test execution order.
- Review coverage for untested decisions in changed code. Coverage is diagnostic; there is no blanket percentage gate while much of the UI remains uncovered. Prioritize booking safety and database guarantees over cosmetic coverage.
- A green fast suite is necessary but does not establish concurrent booking safety or browser layout correctness. Track those gaps until the integration and browser suites above are running.
