# Booking experiments — 2026-11-10

The first local experiments passed the booking correctness checks and established a capacity baseline. They did not find the API's maximum sustainable throughput.

## Correctness

Command: `./scripts/test-load.ps1 -Mode Correctness`

- 100 guests competing for one seat: **1 confirmation, 99 expected seat conflicts**.
- Two overlapping two-seat selections: **1 confirmation, 1 expected seat conflict**, with only two seats allocated.
- Twenty clients each replaying a confirmed request twice: **40 successful replay responses**, all with the original confirmation token and tickets.
- Unexpected outcomes and replay mismatches: **0**.
- Independent database check: **3 bookings, 5 seat allocations**, as expected for the three fixtures.

Evidence: [.dev/load/fe330ac276cd45c99869897bad33b70e/report.md](../.dev/load/fe330ac276cd45c99869897bad33b70e/report.md), with summaries and database checks beside it. These local evidence files are ignored by Git; this document retains the findings.

The replay scenario starts from an existing confirmation. Separate PostgreSQL regression tests exercise concurrent first submissions with one request ID, reversed seat order, and changed-email/seat conflicts.

## Capacity baseline

Command: `./scripts/test-load.ps1` (capacity portion)

Five 30-second stages offered 1 → 12 → 25 → 50 → 50 → 0 iterations per second. The workload was approximately 80% showtimes reads and 20% single-seat guest bookings, with initial CSRF requests in addition. Forty screenings provided 10,000 distinct capacity booking slots; no booking reused a sold slot.

- Completed workload iterations: **4,124**.
- HTTP requests, including initial guest sessions: **4,224**.
- Confirmed capacity bookings: **825**, reconciled against 825 persisted bookings and allocations.
- Unexpected outcomes: **0**. Dropped iterations: **0**.
- Booking response time across the whole capacity run: median **17.9 ms**, p95 **43.9 ms**, p99 **95.0 ms**.
- Showtimes response time across the whole capacity run: median **3.3 ms**, p95 **9.0 ms**, p99 **18.8 ms**.

These percentiles combine all traffic stages; they are not peak-stage percentiles. The raw timestamped measurements are available for per-stage analysis. No latency target was imposed before measuring the baseline.

Evidence: [.dev/load/17a048c92f594b1f9b341ea72c2f23e9/capacity-summary.json](../.dev/load/17a048c92f594b1f9b341ea72c2f23e9/capacity-summary.json), `capacity-timeseries.jsonl`, `database-check.json`, `postgres-samples.jsonl` and `run.json` in the same directory.

That initial combined invocation exited nonzero because its replay assertion compared JSON object key ordering. The comparison was corrected to compare ticket fields; the subsequent correctness invocation passed. The capacity portion and its independent database reconciliation passed in the initial invocation. No booking application fix was necessary.

## Environment and validation

- Windows 10 Pro; Intel Core i7-4770K, eight logical processors; 7.95 GiB visible RAM.
- .NET SDK 10.0.102; k6 1.6.1; Docker 29.1.3; PostgreSQL 18.
- PostgreSQL image ID: `sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6`.
- API: actual Release build, Production configuration, loopback HTTPS, real CSRF middleware and pooled PostgreSQL connections; maximum API pool size 50.
- Source baseline: `e1793d0c3660fb79790216fe50d956de372bb784` plus the uncommitted load-test work recorded in each run's metadata.
- Fast backend tests: **41 passed**. PostgreSQL integration tests: **23 passed**, including the three new replay/payload cases. No tests skipped.
- Final combined runner check: `./scripts/test-load.ps1 -StageSeconds 5` **passed**, including correctness, 138 additional capacity bookings, report generation and database reconciliation. This shortened run validates the final runner; the longer run above remains the performance baseline. Evidence: [.dev/load/f771f5dbb3dc4ab8bdc06f0c76a4d8ea/report.md](../.dev/load/f771f5dbb3dc4ab8bdc06f0c76a4d8ea/report.md).
- Disposable test containers were removed after execution. The normal Compose database was not used.

The repository formatter was run. Its check reports three existing blank-line differences in frontend account files; those unrelated files were restored to their original content. The changed JavaScript and documentation receive separate formatting checks. No frontend behavior changed.

## Interpretation

The system handled this local mixed workload up to a requested peak of 50 operations per second without booking errors or dropped work. That peak includes about ten bookings per second, not fifty bookings per second. The 100-customer same-seat burst is a separate contention experiment.

The load generator, API and database share this machine. One-second lock samples can miss brief waits, and HTTP request alignment does not prove all possible database interleavings. There is no production capacity claim, long-duration stability claim, or multi-instance recovery claim. The next performance experiment should choose an explicit latency target and increase the offered rate beyond this baseline, while retaining the same correctness checks.

See [the runner guide](booking-load-tests.md) for repeatable commands and limitations.
