# cinemaR

React + TypeScript cinema schedule and seat selection backed by ASP.NET Core 10, EF Core, and PostgreSQL. Movie details, auditoriums, screenings, and seat layouts come from the database. Artwork remains local. The API exposes GET endpoints only; checkout and administration follow later.

## Requirements and startup

Install .NET 10 SDK (see global.json), Node.js 22.12+, and Docker Desktop with Linux containers. From the repository root:

```powershell
docker compose up -d --wait
dotnet tool restore
dotnet restore Cinema.slnx --locked-mode
dotnet run --project src/backend --launch-profile http
```

Development startup applies committed EF migrations and seeds an empty catalog once: eight movies, three auditoriums, and 84 screenings across seven Kyiv calendar dates beginning on the initialization date. Each date offers six films from the rotating eight-film catalog, with twelve screenings and date/room-specific times. Initial data intentionally includes earlier screenings today. The versioned v2 seed upgrades the original v1 catalog by replacing unchanged seeded screenings, preserving existing movie text and custom/edited screenings, and skipping conflicting slots. Preserved custom data can reduce the number of new slots. Subsequent starts preserve all stored data and dates. The seed is not a rolling schedule; after seven days an empty schedule is expected until more screenings are deliberately added.

In another terminal:

```powershell
cd src/frontend
npm ci
npm run dev
```

Open [cinemaR](http://localhost:5173) or [the schedule](http://localhost:5173/schedule). The API listens on port 5080; Vite proxies /api to it. Each selected date fetches that Kyiv day's screenings, including earlier screenings, which appear muted with Started or Finished labels that update while the page is open. Movies without screenings on that date are omitted. Skeleton loading, empty, error, retry, and failed refresh states are supported; cached results belong to the selected date. Results space is preserved across date changes to avoid scroll jumps.

## PostgreSQL

Compose publishes the database on **127.0.0.1:5433**, avoiding the usual host PostgreSQL port. Database/user: `cinemar`; password: `cinemar_local`. These are local development credentials, also configured in src/backend/appsettings.Development.json. Override the API connection with `ConnectionStrings__Cinema` when needed. The postgres:18 image keeps durable data in the named cinemar_postgres_data volume mounted at /var/lib/postgresql.

```powershell
docker compose ps
docker compose exec postgres psql -U cinemar -d cinemar
docker compose stop
docker compose start --wait
```

Container stops and recreation preserve data. **docker compose down --volumes permanently deletes this project's database.** Use that command only for a deliberate local reset; the next Development startup creates and seeds a new database with new dates.

The Catalog-owned schema contains movies, auditoriums, showtimes, seed_history, and EF migration history. Screenings use UTC timestamptz instants and restrictive foreign keys. Each screening's occupied interval captures scheduled runtime plus a 15-minute turnaround. A PostgreSQL exclusion constraint prevents overlapping intervals in the same auditorium; different auditoriums can screen movies simultaneously. Later runtime edits must deliberately reschedule existing screenings.

## Read API

- GET /api/showtimes?date=2026-10-27: screenings starting on that Europe/Kyiv date, ordered by instant then ID. Each item includes id, UTC startsAt, movie, and auditorium (id/name). Empty dates return []. Missing, malformed, and out-of-range dates return 400 Problem Details; accepted years are 1900–9998.
- GET /health: process liveness.
- GET /api/showtimes/{showtimeId}/seats: movie, auditorium, ordered seats with labels and zero-based grid positions, UTC startsAt/serverNow, and selectionOpen. Unknown showtimes return 404 Problem Details; started showtimes return a layout with selectionOpen=false. HTTP caching is disabled. Development seeding adds distinct layouts for the three sample auditoriums, preserving existing custom seats.
- GET /health/ready: PostgreSQL connectivity, returning 503 when unavailable.

The unused /api/movies endpoint was removed; the schedule response supplies all displayed movie information. No write endpoints exist. Cancellation flows into database reads, and unhandled request errors use Problem Details. There is no fallback to an in-memory catalog or generated times.

```powershell
$cinemaDate = [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'Europe/Kyiv').ToString('yyyy-MM-dd')
Invoke-RestMethod "http://localhost:5080/api/showtimes?date=$cinemaDate"
Invoke-WebRequest http://localhost:5080/health/ready
```

## Migrations and verification

```powershell
dotnet ef migrations add DescribeChange --project src/backend --output-dir Data/Migrations
dotnet ef migrations script --idempotent --project src/backend --output catalog-migrations.sql
dotnet build Cinema.slnx --no-restore
cd src/frontend
npm run build
```

Commit migrations and the backend dependency lockfile. The local EF tool is pinned in dotnet-tools.json. The initial migration contains custom exclusion-constraint SQL that EF does not represent in its model snapshot; preserve it during future schema changes.

Automatic migration and seeding run only in Development. Other environments require ConnectionStrings__Cinema and an explicit migration procedure before starting. EF tooling also needs connection configuration; append `-- --environment Development` when deliberately targeting the local development database. Keep the development credentials local.

Automated tests are currently removed. Verify compilation with the backend and frontend builds above, and use the frontend guide for manual walkthroughs. If the sandbox prevents Vite's default config bundler from reading parent directories, use `npm run build -- --configLoader runner`.

## Project and learning documents

- src/backend/Data: EF context, migrations, one-time seed, readiness check.
- src/backend/Movies: movie domain model (independent of showtimes).
- src/backend/Schedule: auditorium/showtime models and Kyiv calendar boundaries.
- src/backend/Controllers: HTTP binding and responses. Schedule/Services owns date rules and DTO composition; Schedule/Repositories defines the materialized query contract; Data/Repositories implements EF reads. Flow: Controller → IScheduleService → IShowtimeRepository → EF Core. EF entities and IQueryable never cross the repository boundary.
- src/frontend/src/features/schedule: dated queries and schedule presentation.
- src/frontend/src/shared/components/MovieArtwork: shared movie illustrations and optional local artwork files.
- [CONTEXT.md](CONTEXT.md): domain glossary.
- [ROADMAP.md](ROADMAP.md): learning milestones.
- [Frontend guide](docs/frontend.md): entrance and frontend conventions.
- [Seat selection](docs/seat-selection.md): feature scope, API behavior, and manual verification. Choose an upcoming showtime to select up to eight seats; selection stays local and does not reserve seats.
- [Persistent catalog decision](docs/adr/0002-persistent-catalog.md): calendar rules, occupied intervals, and read-only scope.
- [Artwork instructions](src/frontend/src/shared/components/MovieArtwork/artwork/assets/README.md): optional local posters.

References: [Npgsql EF Core 10](https://www.npgsql.org/efcore/release-notes/10.0.html), [PostgreSQL exclusion constraints](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION).

