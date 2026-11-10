# Booking load tests

This suite uses k6 to send real HTTP traffic to a disposable Release API and PostgreSQL database. These JavaScript files run in k6, not in the React frontend.

```text
tests/load/
  scenarios/
    correctness.js        # Same-seat contention, overlapping seats, safe retries
    capacity.js           # Increasing browsing and booking traffic
  support/
    config.js             # Fixture loading, client settings, summary output
    bookingClient.js      # Guest CSRF sessions, booking requests, outcome metrics
  fixtures/
    CinemaR.LoadTests.csproj
    Program.cs            # Command dispatch only
    LoadTestRun.cs        # Isolated database configuration and output paths
    Commands/
      PrepareFixture.cs   # Migrations, future screenings, local HTTPS certificate
      VerifyBookings.cs   # Independent database checks after traffic
      ObservePostgres.cs  # Connection and lock-wait samples
  run.ps1                 # Builds, starts, runs, reports and cleans up
```

From the repository root, use the existing public command:

```powershell
./scripts/test-load.ps1
./scripts/test-load.ps1 -Mode Correctness
./scripts/test-load.ps1 -Mode Capacity
```

`scripts/test-load.ps1` forwards to this suite's runner. Direct invocation of `./tests/load/run.ps1` accepts the same options. Both locate files relative to the runner, so the current working directory does not matter.

Add new workloads under `scenarios`. Keep HTTP/session handling in `support`; keep database setup and assertions in the fixture tool. Generated data, certificates, logs and results stay under ignored `.dev/load/<run ID>`, outside test source.

Heavy load experiments remain manual. CI builds the fixture tool and runs the separate fast/backend PostgreSQL regression suites.

See [the runner guide](../../docs/booking-load-tests.md) for prerequisites, workloads and interpretation, and [initial results](../../docs/booking-load-results.md) for the measured baseline.
