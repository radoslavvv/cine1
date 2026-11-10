# cinemaR reliability plan

Build these three stages in order. Keep the cinema features in the existing API and PostgreSQL database. Add only one new application: a notification worker.

## 1. Stress-test bookings

Implemented the isolated runner and initial experiments. See [commands](booking-load-tests.md) and [measured results](booking-load-results.md). Maximum sustainable throughput remains unmeasured; the first run establishes a baseline.

1. Extend the existing PostgreSQL integration suite with missing booking races and concurrent retries.
2. Add a repeatable k6 test setup using a disposable database and future-dated screenings. Never target the normal development database.
3. Run three workloads: 100 customers competing for one seat, overlapping multi-seat selections, and sustained browsing plus bookings.
4. Record successful bookings, expected conflicts, unexpected errors, response times, and database lock waits. Check database invariants after each run.
5. Save the commands, machine details, results, and any measured improvements in a short report.

**Done when:** the same-seat test produces exactly one booking; multi-seat requests succeed entirely or allocate nothing; retries recover the original booking; sustained traffic has a documented baseline. Expected seat conflicts are counted separately from failures.

Use deterministic integration tests for correctness and k6 for performance. Establish the baseline before setting performance targets. A traffic test is evidence for its tested workload, not proof of every possible race.

## 2. Add a load balancer and two API instances

1. Containerize the API and add a separate Compose setup with a reverse proxy, two API instances, and the disposable database.
2. Share authentication protection keys, configure trusted proxy headers, and decide whether rate limits apply per instance or across both.
3. Apply migrations once before starting the API instances. Reuse readiness checks and configure graceful shutdown.
4. Repeat the booking tests through the proxy, verifying that both instances receive traffic.
5. Stop one instance during traffic. Test a lost booking response followed by a retry through the surviving instance using the same request ID.

**Done when:** sign-in works across both instances, healthy traffic continues after one stops, and retries never create duplicate bookings. Record interrupted requests and recovery time; do not require every in-flight request to succeed.

This demonstrates API instance recovery. The local proxy and database remain single points of failure.

## 3. Add a separate booking email worker

1. Save a notification task alongside each confirmed booking in the same database transaction. This pending-task table is the transactional outbox.
2. Create a separately runnable .NET worker that safely claims pending tasks and sends booking emails to Mailpit.
3. Record delivery attempts, use bounded retries, and provide a way to inspect and retry exhausted tasks. Keep confirmation tokens and customer details out of logs.
4. Stop the worker and email server, make bookings, then restart them. Test worker crashes and competing workers as well.
5. Document the case where email is accepted but the worker crashes before recording success. Use provider idempotency if supported; otherwise acknowledge that a duplicate email is possible.

**Done when:** email outages do not block bookings, pending tasks survive restarts, concurrent workers claim work safely, and failed deliveries can be inspected and retried.

Start with the worker and PostgreSQL outbox. RabbitMQ and independent notification data ownership can follow if learning service-to-service messaging becomes the next objective. This worker alone is not a fully independent microservice.

## Delivery rules

- Complete and document one stage before starting the next.
- Run existing regression checks plus the new checks relevant to each stage.
- Keep short correctness checks in CI; run longer load and failure experiments explicitly.
- Each stage delivers runnable commands, observable results, and a short explanation of limitations.
- Defer Redis, Kubernetes, payment services, and further service extraction until these stages are complete.
