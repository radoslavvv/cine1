# Booking correctness and capacity

The suite lives under [`tests/load`](../tests/load/README.md): separate k6 entry points for correctness and capacity, shared HTTP support, a .NET fixture tool, and its environment runner. `scripts/test-load.ps1` is the stable public entry point.

Run the isolated experiments on Windows with PowerShell 7, .NET 10 and Docker Desktop:

```powershell
./scripts/test-load.ps1
```

The runner downloads pinned k6 1.6.1 into `.dev/tools`, checks its archive against the official SHA-256 checksum, and starts a new PostgreSQL 18 container on a random loopback port. It applies the actual migrations, seeds future screenings, and starts the real Release API in Production on a temporary loopback HTTPS port. It supplies its own test certificate; only the load client skips certificate verification. CSRF protection and secure cookies stay enabled.

The normal Compose database and API are never used. The API processes and random database container are removed on completion or a handled failure. If the runner is forcibly terminated, remove only its `cinemar-load-<run ID>` container; its ID is also the output folder name. No application code or test-only API endpoints are added.

## Workloads

Run just the correctness experiments:

```powershell
./scripts/test-load.ps1 -Mode Correctness
```

- **Same seat:** 100 guest clients fetch their own CSRF tokens and make one booking request each. Require exactly one HTTP 200 and 99 HTTP 409 responses with `code: seats_taken`.
- **Overlapping selections:** two guests request seats A+B and B+C. Require one confirmation and one seat conflict, with only the winning pair allocated.
- **Replay:** twenty clients replay the same previously confirmed request, then repeat with reversed seat order. All forty responses must contain the original confirmation token and identical tickets.
- **Database check:** each of those screenings must contain exactly one booking with the expected number of allocated seats. Empty/oversized bookings and foreign-auditorium allocations fail verification.

HTTP bursts are approximately aligned after session setup, not guaranteed to reach a particular database instruction simultaneously. The existing PostgreSQL integration suite also includes start-gated concurrent creation/replay and changed-email/seat request-ID conflicts. Keep those correctness checks in the existing CI PostgreSQL job; run k6 explicitly.

Run the capacity baseline separately:

```powershell
./scripts/test-load.ps1 -Mode Capacity
./scripts/test-load.ps1 -Mode Capacity -PeakRate 100 -StageSeconds 60
```

The default is five 30-second stages: ramp from 1 to 12 iterations/second, then 25, then 50, hold 50, then ramp down to zero. Each iteration is one showtimes read or one single-seat booking: 80% reads, 20% bookings. Initial CSRF session requests are additional traffic. Forty screenings with 250 seats each supply 10,000 unique booking slots. Each booking targets a new slot, so sold-out conflicts cannot conceal capacity problems. The API's database pool remains enabled and is explicitly limited to 50 connections. k6 is bounded to 100 virtual users; parameters are capped at 100 iterations/second and 60 seconds per stage.

There is no response-time target yet. Record the baseline before choosing one. Unexpected outcomes, failed booking/DB reconciliation, or dropped iterations make the command fail. A dropped iteration means k6 could not generate all requested work with its available clients; it does not by itself identify an API bottleneck. Use the time series to compare offered traffic, completed work, latency, and failures at each stage. If the highest stage remains healthy, report that tested rate and extend a future experiment deliberately; do not claim the system's maximum capacity was found.

## Results

Every invocation prints its `.dev/load/<run ID>` directory. It contains:

- `report.md`: a readable summary of the completed experiments.
- `run.json`: commit, working-tree status, CPU, RAM, software/image versions, workload and pool settings.
- `correctness-summary.json` / `capacity-summary.json`: counts and latency distributions, including median, p95 and p99. Capacity metrics distinguish booking and browsing latency.
- `*-timeseries.jsonl`: timestamped k6 measurements for investigating individual stages.
- `postgres-samples.jsonl`: one-second samples of active connections and connections waiting on database locks.
- `database-check.json`: independent persistence checks and reconciliation of capacity confirmations against stored bookings and allocations.
- `result.json`: overall result after completed experiments; setup failures instead exit nonzero with an error.
- API and observer logs, plus the disposable fixture and test certificate. These stay under ignored `.dev` and should not be published wholesale.

Lock samples can miss short waits; they are not lock-duration measurements. Client latency includes local TLS/network and API processing. The load generator, API and Docker database share the developer machine, so background activity and local resource competition affect results. This is a local baseline, not a production capacity claim. Signed-in traffic, admission, payments, long soak tests and multi-instance recovery remain later experiments.

## Documentation

- [k6 arrival-rate workloads](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-arrival-rate/) explains how offered traffic is kept independent of response speed.
- [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) explains executable pass/fail criteria.
- [k6 metrics](https://grafana.com/docs/k6/latest/using-k6/metrics/) explains the measurements.
- [Repository testing strategy](testing.md) describes the fast and PostgreSQL regression suites.
