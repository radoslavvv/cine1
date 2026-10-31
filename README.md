# cinemaR

React + TypeScript cinema showtimes and seat selection backed by ASP.NET Core 10, EF Core, and PostgreSQL. Movie details, auditoriums, screenings, and seat layouts come from the database. Artwork remains local. Customer accounts support email verification, password recovery, and personal booking history; guests can still book. Administration requires the single administrator's verified account in every environment.

## Requirements and startup

Install .NET 10 SDK (see global.json), Node.js 22.12+, and Docker Desktop with Linux containers. From the repository root:

```powershell
docker compose up -d --wait
dotnet tool restore
dotnet restore CinemaR.slnx --locked-mode
dotnet run --project src/backend/CinemaR.Api --launch-profile http
```

Development startup applies committed EF migrations and seeds cinema data once. The v3 expansion provides 15 movies with six showtimes per movie, per format (2D, 3D, IMAX 2D, IMAX 3D), on each of seven Kyiv calendar dates beginning on the upgrade date: 2,520 additional screenings. Times span early morning to late evening and vary by movie, format, and date. Sixty dedicated demo screens include standard and larger IMAX seat layouts, with non-overlapping screenings and a 15-minute turnaround. Existing movies, screenings, seats, and bookings are preserved, so some movies also retain extra showtimes from earlier seeds. Initial data intentionally includes earlier screenings today. The expansion is versioned and transactional; subsequent starts preserve all stored data and dates without adding duplicates. Custom screenings in an expansion screen take precedence over conflicting seed slots. The seed is not a rolling set of showtimes; after seven days no showtimes is expected until more screenings are deliberately added.

In another terminal:

```powershell
cd src/frontend
npm ci
npm run dev
```

Open [cinemaR](http://localhost:5173) or [the showtimes](http://localhost:5173/showtimes). The API listens on port 5080; Vite proxies /api to it. Each selected date fetches that Kyiv day's screenings, including earlier screenings, which appear muted with Started or Finished labels calculated when the showtimes renders. Movies without screenings on that date are omitted. Skeleton loading, empty, error, retry, and failed refresh states are supported; cached results belong to the selected date. Results use a CSS minimum height during loading.

## Formatting

Follow the [project readability convention](.cursor/rules/readable-code.mdc) for explicit bodies, braces, and blank lines between logical steps, with concise LINQ and anonymous callbacks preserved.

Format the repository in one pass (readable TypeScript/JavaScript formatting, Prettier for frontend/configuration/docs, and the .NET style and whitespace formatters for C#):

```powershell
./scripts/format.ps1
./scripts/format.ps1 -Check
```

Run `npm ci --prefix src/frontend` first if dependencies are not installed. For frontend and JavaScript script formatting, run `npm run format --prefix src/frontend`. VS Code and Cursor workspace settings use the same Prettier configuration on save and paste; install the recommended Prettier extension if prompted. Run the repository formatter after bulk edits or generated changes so explicit bodies, braces, and logical spacing are applied without opening each file.

## PostgreSQL

Compose also starts [Mailpit's local email inbox](http://localhost:8025), with SMTP on loopback port 1025. Account verification and password-reset messages appear there. Register at `/account/register`, verify the email, and sign in. To provision the single administrator, run `dotnet run --project src/backend/CinemaR.Api --no-launch-profile -- setup-admin --environment Development` and supply its email/password at the prompts. Then verify its email in Mailpit. See [authentication setup and behavior](docs/authentication-design.md) for session rules, configuration, and isolated live checks.

Compose publishes the database on **127.0.0.1:5433**, avoiding the usual host PostgreSQL port. Database: `cinemaR`; local PostgreSQL role: `cinemar`; password: `cinemar_local`. These are local development credentials, also configured in src/backend/CinemaR.Api/appsettings.Development.json. Override the API connection with `ConnectionStrings__CinemaR` when needed. The postgres:18 image keeps durable data in the named cinemar_postgres_data volume mounted at /var/lib/postgresql.

```powershell
docker compose ps
docker compose exec postgres psql -U cinemar -d cinemaR
docker compose stop
docker compose start --wait
```

`start.ps1` upgrades an existing local database named `cinemar` to `cinemaR` without resetting its volume. Stop older API processes first. Compose and npm identifiers remain lowercase for tooling compatibility; the existing PostgreSQL role and volume are retained.

Container stops and recreation preserve data. **docker compose down --volumes permanently deletes this project's database.** Use that command only for a deliberate local reset; the next Development startup creates and seeds a new database with new dates.

The `"cinemaR"` schema contains movies, auditoriums, showtimes, seed_history, and EF migration history. Screenings use UTC timestamptz instants and restrictive foreign keys. Each screening's occupied interval captures scheduled runtime plus a 15-minute turnaround. A PostgreSQL exclusion constraint prevents overlapping intervals in the same auditorium; different auditoriums can screen movies simultaneously. Later runtime edits must deliberately change existing showtimes.

## Read API

- GET /api/showtimes?date=2026-10-28&format=2D&genre=Sci-Fi: matching screenings starting on that Europe/Kyiv date, ordered by instant then ID. Date and format are required; genre is optional and matches any genre on the movie. Filtering happens in PostgreSQL. Each item includes id, UTC startsAt, movie, auditorium (id/name), and format (2D, 3D, IMAX 2D, or IMAX 3D). No matches return []. Missing or invalid date/format returns 400 Problem Details; accepted years are 1900–9998. Date-only requests do not return the full daily showtimes.
- GET /health: process liveness.
- GET /api/showtimes/{showtimeId}/seats: movie, auditorium, ordered seats with labels and zero-based grid positions, UTC startsAt/serverNow, and selectionOpen. Unknown showtimes return 404 Problem Details; started showtimes return a layout with selectionOpen=false. HTTP caching is disabled. Development seeding adds distinct layouts for the three sample auditoriums, preserving existing custom seats.
- GET /health/ready: PostgreSQL connectivity, returning 503 when unavailable.

The unused /api/movies endpoint was removed; the showtimes response supplies all displayed movie information. Booking confirmation and local administration also expose write endpoints. Cancellation flows into database reads, and unhandled request errors use Problem Details. There is no fallback to in-memory movie data or generated times.

```powershell
$cinemaDate = [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'Europe/Kyiv').ToString('yyyy-MM-dd')
Invoke-RestMethod "http://localhost:5080/api/showtimes?date=$cinemaDate&format=2D"
Invoke-WebRequest http://localhost:5080/health/ready
```

## Migrations and verification

```powershell
dotnet ef migrations add DescribeChange --project src/backend/CinemaR.Infrastructure --startup-project src/backend/CinemaR.Api --output-dir Data/Migrations
dotnet ef migrations script --idempotent --project src/backend/CinemaR.Infrastructure --startup-project src/backend/CinemaR.Api --output cinemaR-migrations.sql
dotnet build CinemaR.slnx --no-restore
dotnet test CinemaR.slnx --no-restore
cd src/frontend
npm run build
```

Commit migrations and each project’s dependency lockfile. The local EF tool is pinned in dotnet-tools.json. The initial migration contains custom exclusion-constraint SQL that EF does not represent in its model snapshot; preserve it during future schema changes.

Automatic migration and seeding run only in Development. Other environments require ConnectionStrings__CinemaR and an explicit migration procedure before starting. EF tooling also needs connection configuration; append `-- --environment Development` when deliberately targeting the local development database. Keep the development credentials local.

Backend tests cover application rules, project dependency boundaries, controller dependencies, EF model/migration compatibility, and HTTP validation/error contracts without requiring a database. Frontend tests use Vitest and React Testing Library for booking hooks and seat-map interactions. Run `npm test --prefix src/frontend` and `npm run test:legacy --prefix src/frontend`; use `npm run test:coverage --prefix src/frontend` for coverage reports. See the [testing strategy](docs/testing.md) for CI, test conventions, and the PostgreSQL/browser coverage roadmap. If the sandbox prevents Vite's default config bundler from reading parent directories, use `npm run build -- --configLoader runner`.

## Project and learning documents

- src/backend/CinemaR.Domain: entities and cinema calendar rules; no framework or project dependencies.
- src/backend/CinemaR.Application: use-case services, commands/queries, response/read models, and repository interfaces; references Domain only.
- src/backend/CinemaR.Infrastructure: EF context, migrations, repositories, seeding, readiness, and transaction/locking details; implements Application interfaces.
- src/backend/CinemaR.Api: HTTP request validation, request-to-command mapping, controllers, error responses, and dependency wiring.
- src/backend/CinemaR.Tests: application and architecture regression tests.
- [Backend guide](docs/backend.md): project dependencies, request flow, conventions, and migration commands.
- src/frontend/src/features/showtimes: dated queries and showtimes presentation.
- src/frontend/src/shared/components/MovieArtwork: shared movie illustrations and optional local artwork files.
- [CONTEXT.md](CONTEXT.md): domain glossary.
- [ROADMAP.md](ROADMAP.md): learning milestones.
- [Frontend guide](docs/frontend.md): entrance and frontend conventions.
- [Seat selection](docs/seat-selection.md): feature scope, API behavior, and manual verification. Choose an upcoming showtime to select up to eight seats; selection stays local and does not reserve seats.
- [Persistent catalog decision](docs/adr/0002-persistent-catalog.md): calendar rules, occupied intervals, and read-only scope.
- [Artwork instructions](src/frontend/src/shared/components/MovieArtwork/artwork/assets/README.md): optional local posters.

References: [Npgsql EF Core 10](https://www.npgsql.org/efcore/release-notes/10.0.html), [PostgreSQL exclusion constraints](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION).
