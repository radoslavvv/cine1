# Cinema Booking System: React + .NET Learning Roadmap

## Summary

Build a working cinema booking app, then evolve it from a modular monolith into a small event-driven system. Each milestone introduces a backend problem, a way to observe it, and an experiment that proves the solution works.

**Pace:** approximately 24–30 weeks at 5–8 hours per week. Progress depends on meeting acceptance criteria rather than following fixed dates.

**Core stack:** React with TypeScript, ASP.NET Core, EF Core, PostgreSQL, Docker Compose, RabbitMQ, and OpenTelemetry. Add Redis when investigating caching. Select supported stable versions when each component is introduced.

## Product and architecture

Customers can browse movies and showtimes, select seats, hold them for checkout, simulate payment, and view tickets and booking history. Administrators can manage movies, auditoriums, seating layouts, and showtimes.

Start with one backend deployment and one PostgreSQL database, organized into modules:

- **Catalog:** movies, cinemas, auditoriums, and showtimes.
- **Booking:** seat availability, holds, bookings, and tickets. Keep these together so seat allocation and booking confirmation remain transactional.
- **Payments:** simulated payment attempts, outcomes, and reversals.
- **Notifications:** booking confirmation delivery to a local development inbox.
- **Identity:** customer accounts and administrator permissions.

Use module-owned schemas and explicit application interfaces. Modules must not modify another module's tables directly.

Eventually extract **Notifications**, followed by **Payments**, into separate services with their own databases and credentials. Catalog and Booking remain together for this project. Use a single repository throughout.

## Learning milestones

### Initial scaffold — complete

- [x] Connect React + TypeScript to a .NET 10 controller API with an injected sample movie catalog.
- [x] Add the health endpoint, fixed development ports, API proxy, solution, and dependency lockfiles.
- [x] Save the roadmap, setup instructions, and domain glossary.
- [x] Build both projects and verify the live API/proxy, loading, empty, failure, retry, and mobile states.

This completes the scaffold only. The full first milestone below remains open.

### Frontend foundation — complete

- [x] Organize the client into app setup, a movies feature, and shared UI.
- [x] Introduce TanStack Query, development-only devtools, and explicit catalog caching/retry settings.
- [x] Redesign the catalog as a dark cinema lobby with violet surfaces, amber lighting, subtle ceiling lights, and original patterned-carpet accents.
- [x] Migrate styling to Tailwind v4 with a separate `app/theme.css` for design tokens and atmospheric utilities.
- [x] Support user-supplied local posters/backdrops with illustrated fallbacks; artwork files are pending user supply.
- [x] Document feature boundaries and Query learning exercises in `docs/frontend.md`.

### 1. Build a usable vertical slice — 3–4 weeks

- [ ] Complete milestone 1 and its acceptance criteria.
- [ ] Set up React, the .NET API, PostgreSQL, migrations, Docker Compose, and CI.
- [ ] Implement movie/showtime administration and customer browsing.
- [ ] Add accounts using ASP.NET Core Identity and secure cookie authentication, with CSRF protection and customer/admin authorization.
- [ ] Build a simple seat map and booking history.
- [ ] Establish request validation, consistent API errors, structured logs, and cancellation handling.

**Done when:** a fresh checkout runs using documented commands, migrations create the database, and a customer can complete a basic simulated booking.

The initial scaffold is the first step within this milestone: a React movie list connected to a controller API with sample data. It does not complete the milestone by itself.

### 2. Make seat booking correct under concurrency — 4–5 weeks

- [ ] Complete milestone 2 and its acceptance criteria.
- [ ] Introduce a five-minute seat hold, using server-controlled timestamps.
- [ ] Model explicit hold and booking states. Reserve all requested seats atomically or reject the entire request.
- [ ] Make PostgreSQL authoritative for ownership: conditional updates and transactions must prevent overlapping live holds or sales.
- [ ] Acquire seat locks in a consistent order. Keep transactions short and exclude payment calls from them.
- [ ] Add idempotency keys to hold creation and checkout.
- [ ] Add expiration cleanup in a background worker; requests must also recognize expired holds without waiting for cleanup.

**Experiments:** reproduce double booking in an isolated exercise, compare optimistic concurrency with row locking, and deliberately create a deadlock before fixing lock ordering and adding bounded transaction retries. PostgreSQL documents both deadlock detection and consistent lock ordering as a defense. [Reference](https://www.postgresql.org/docs/17/explicit-locking.html)

**Done when:** 100 simultaneous requests for one seat produce one successful live hold, and overlapping multi-seat requests never partially succeed.

### 3. Introduce reliable event-driven behavior — 4 weeks

- [ ] Complete milestone 3 and its acceptance criteria.
- [ ] Add RabbitMQ and a transactional outbox: save business changes and outgoing events in the same database transaction.
- [ ] Implement a publisher worker, consumer deduplication, bounded retries, dead-letter handling, and manual replay.
- [ ] Define versioned events such as `BookingConfirmed`, carrying event IDs, timestamps, correlation IDs, and the consumer's required data.
- [ ] Start with asynchronous notifications while keeping checkout transactional inside the application.
- [ ] Treat delivery as at least once; make consumer effects idempotent.

**Experiments:** stop RabbitMQ, crash after publishing but before recording delivery, and deliver duplicate messages. Microsoft's guidance describes the outbox approach and the need for idempotent processing. [Reference](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/asynchronous-message-based-communication)

**Done when:** committed events survive restarts, duplicates do not duplicate notification records, and failed messages can be inspected and replayed.

### 4. Extract services and handle distributed workflows — 4–5 weeks

- [ ] Complete milestone 4 and its acceptance criteria.
- [ ] Extract Notifications first, then Payments.
- [ ] Replace direct payment calls with an asynchronous checkout workflow coordinated by Booking.
- [ ] Atomically move a valid hold into checkout with a bounded payment deadline, preventing ordinary hold cleanup from releasing it.
- [ ] Handle payment success, rejection, timeout, duplicate outcomes, and out-of-order outcomes.
- [ ] Confirm tickets only after Booking accepts payment success. If success arrives after checkout has expired, request an idempotent simulated reversal.
- [ ] Expose checkout status through the API and show pending, confirmed, or failed states in React using polling.

**Done when:** each service restarts independently, uses only its own database, and failures leave every checkout in an explainable state with a recovery path.

### 5. Measure load and improve performance — 4–5 weeks

- [ ] Complete milestone 5 and its acceptance criteria.
- [ ] Add distributed traces, metrics, and dashboards using OpenTelemetry, Prometheus, Grafana, and a trace backend.
- [ ] Track latency percentiles, throughput, unexpected errors, database pool usage, lock waits, queue depth, and outbox age.
- [ ] Create k6 workloads for browsing, ordinary bookings, a popular-showtime surge, and sustained traffic.
- [ ] Inspect query plans and fix indexes, pagination, and inefficient EF Core queries.
- [ ] Add Redis caching for catalog reads with a documented TTL. Seat allocation must always validate against PostgreSQL.
- [ ] Run multiple API instances; investigate connection-pool limits, thread-pool starvation, rate limiting, and backpressure.

**Done when:** a report records hardware, dataset, workload, baseline, bottleneck, change, and measured result. Find the machine's sustainable throughput rather than claiming production-scale capacity from local tests.

### 6. Harden and document the system — 3–4 weeks

- [ ] Complete milestone 6 and its acceptance criteria.
- [ ] Add health/readiness checks, graceful shutdown, secret configuration, and migration procedures.
- [ ] Exercise database restart, broker outage, slow payments, worker crashes, and restoration from a local backup.
- [ ] Complete authorization checks, ownership checks, and server-side price validation.
- [ ] Document architecture decisions, failure recovery, and the tradeoffs observed during service extraction.

**Done when:** another developer can run the app, reproduce the concurrency and failure experiments, and understand why each major component exists.

## Testing and working method

For every milestone: implement a small feature, test its invariant, observe a failure, fix it, and record what changed.

- Use unit tests for state transitions and expiration rules.
- Use integration tests against real PostgreSQL and RabbitMQ through Testcontainers.
- Use Playwright for the customer booking flow and administrator permissions.
- Include races between checkout and expiration, duplicate checkout requests, late payments, consumer restarts, and multi-instance processing.
- Check booking invariants after load tests; expected seat conflicts must be counted separately from unexpected server errors.
- Keep short learning notes and architecture decision records in the repository.

## Defaults and boundaries

- One developer, local Docker environment, simulated payments, and a development notification inbox.
- Fixed ticket prices initially; defer refunds, promotions, and advanced scheduling.
- Keep the frontend functional and simple so backend work receives most of the time.
- Defer Kubernetes, event sourcing, multi-region deployment, and real payment processing.
- Begin with a running vertical slice; introduce each infrastructure component at the milestone that demonstrates its purpose.
