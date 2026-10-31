# Backend guide

The backend uses a small Clean/Onion-style architecture with four projects. It borrows the inward dependency rule without adding a mediator, event bus, generic repository, or full DDD aggregate model. Features remain grouped by cinema concepts inside each project.

## Projects and dependencies

- `CinemaR.Domain` contains movies, auditoriums, seats, screenings, confirmed bookings, and Kyiv calendar rules. It references no other project or framework package.
- `CinemaR.Application` references Domain. It owns use-case services, commands and queries, result/response models, repository interfaces, validation, and administration rules.
- `CinemaR.Infrastructure` references Application (and receives Domain transitively). It implements repository interfaces with EF Core/PostgreSQL, including migrations, seed data, database health, and atomic write operations.
- `CinemaR.Api` references Application and Infrastructure. It is the composition root: HTTP routing, binding, request validation, mapping, Problem Details, QR image rendering, and dependency registration live here. Controllers depend on application service interfaces. `Program.cs` calls the API and Infrastructure registration extensions; Infrastructure includes its Identity registration.

The dependency direction is `API → Application → Domain` and `API → Infrastructure → Application`. Domain and Application cannot reference EF, ASP.NET, or Infrastructure. Tests enforce these boundaries.

## Following a request

A showtimes request flows through `ShowtimesController → GetShowtimesQuery → IShowtimesService → IShowtimeRepository → EF Core`. The repository returns materialized read models; the service composes the response. SQL filtering stays in Infrastructure. `IQueryable` and EF-specific types never appear in application interfaces.

Booking confirmation flows through `ConfirmBookingRequest → ConfirmBookingCommand → IBookingService → IBookingRepository`. HTTP annotations validate the request shape. Application rules validate the command before persistence. The repository finalizes the booking within its existing PostgreSQL transaction, screening row lock, uniqueness constraints, and idempotency handling.

Seat availability flows through `SeatMapsController → ISeatMapService → ISeatMapRepository`. `CinemaR.Application/SeatMaps` owns its `Services`, `Repositories`, `ReadModels`, and `Responses`, independently of Booking. The repository reads auditorium seats and booking occupancy; the service applies selection timing. The controller stays in API `Controllers` and the EF implementation stays in Infrastructure `Data/Repositories`, following the shared layout. The endpoint remains `GET /api/showtimes/{showtimeId}/seats`. Booking owns confirmation, tickets, customer history, and booking management; auditorium seat definitions remain in Domain `Auditoriums`.

Administration delegates to `IMovieService`, `IAuditoriumService`, `IShowtimeManagementService`, or `IBookingManagementService`. Commands, contracts and repository interfaces live with their owning concept. Movie, auditorium and showtime writes use `IWriteTransaction`; their EF repositories share only `CinemaWriteRepository` transaction mechanics. Its exclusive advisory lock coordinates with the booking repository’s shared lock, preserving atomic cross-feature checks and writes. A failed batch rolls back all changes.

Infrastructure translates known PostgreSQL write conflicts into application failures. The API maps validation, missing records, and conflicts to HTTP 400, 404, and 409. Application errors do not carry HTTP status codes. Administration requires the verified administrator account in every environment.

Accounts flow through `AccountsController → IAccountService → AccountService`, backed by ASP.NET Core Identity in Infrastructure and the `identity` schema. Cookies, CSRF validation, API challenges, authorization policies, and account rate limits are configured in `CinemaR.Api/Security/SecurityExtensions.cs`. Customer booking history belongs to Booking and is filtered by the authenticated customer's ID through `IMyBookingsService → IMyBookingsRepository`; no email-based claiming occurs. See [authentication](authentication-design.md) for setup and session/ownership rules.

## File organization

Keep one C# type per file, with the filename matching the type name. This includes classes, interfaces, records, enums, commands, requests, responses, and read models. Keep related files together in their feature folder. `Repositories` in Application contains repository interfaces only. Persistence read models belong in the feature’s `ReadModels` folder; operation outcomes and result records belong in `Results`. Infrastructure’s `Data/Repositories` contains the EF implementations. The EF context is named `CinemaRDbContext`.

Test helpers live in individual files under `src/backend/CinemaR.Tests/Support`. EF-generated migration and designer files retain their tooling conventions.

Movies, Auditoriums, Showtimes, SeatMaps, and Booking group application types into `Commands`, `Queries`, `Responses`, `Services`, `Repositories`, `ReadModels`, and `Results` as needed. Admin retains shared management validation/failure handling and `Exceptions`; it owns no umbrella service or repository. Identity owns authentication and accounts. API requests live under `CinemaR.Api/Requests/{Feature}` (Identity, Booking, Movies, Auditoriums, and Showtimes). HTTP security extensions live under `CinemaR.Api/Security`; exception filters live under `CinemaR.Api/Admin/Filters`. Infrastructure Identity groups account, email, and claims implementations in `Services`, user records in `Entities`, and administrator provisioning in `Setup`. Infrastructure Data groups the EF context in `Contexts`, persistence entities in `Entities`, sample data in `Seeding`, readiness checks in `HealthChecks`, advisory locks in `Transactions`, and EF history compatibility in `MigrationHistory`. `Migrations` and `Repositories` retain their existing roles. Namespaces follow these folders.

Use these naming conventions throughout the backend:

- `Requests`: HTTP input models end in `Request`. When an input maps to a command, use the same operation name, such as `SaveMovieRequest` → `SaveMovieCommand`.
- `Commands`: application write inputs use an action and end in `Command`, such as `ConfirmBookingCommand`.
- `Queries`: application read/filter inputs end in `Query`, such as `GetShowtimesQuery` and `GetBookingsQuery`. Do not put queries among response models.
- `Responses`: output DTOs, including nested and administrator DTOs, end in `Response`, such as `MovieResponse`, `AdminMovieResponse`, and `SeatMapMovieResponse`. Use this folder consistently instead of `Contracts`.
- `Results`: operation success/failure wrappers end in `Result`; outcome and failure enums end in `Outcome` or `Failure`. Response data belongs in `Responses` even when a result wraps it.
- `ReadModels`: materialized persistence projections end in `ReadModel`, including conflict projections such as `ShowtimeConflictReadModel`.
- `Exceptions`: exception classes end in `Exception`; keep them out of `Results`.
- `Services` and `Repositories`: application service and repository interfaces start with `I`; their implementations share the same base name, such as `IMovieRepository` and `MovieRepository`. Supporting identity services use their specific role names, such as `AccountEmailSender` and `CinemaRClaimsFactory`.
- Registration extension classes are named `DependencyInjection`, with entry points named `AddCinemaRApi`, `AddCinemaRInfrastructure`, and `AddCinemaRIdentity`.

Use the same feature names wherever the feature appears: `Movies`, `Auditoriums`, `Showtimes`, `SeatMaps`, `Booking`, `Identity`, and `Admin`. Create role folders only when they contain files. Domain entities keep their domain names without DTO suffixes. EF-generated migration names and metadata retain tooling conventions. `ArchitectureTests` checks role suffixes across backend assemblies.

## Adding a feature

1. Add domain concepts/rules only when they represent cinema behavior independent of storage or HTTP.
2. Add an application service operation and a command for a write, or a query for a read with multiple filters. Use simple IDs for straightforward lookups and actions. Keep responses as explicit records.
3. Define only the persistence operations that use case needs. Prefer feature-specific repository methods to a generic CRUD repository. Keep query projections and SQL concerns in Infrastructure.
4. Implement the repository and preserve transaction boundaries around rules that depend on current database state.
5. Bind an HTTP request in the API, map it to the application input, call the service, and translate the result to HTTP. Avoid business logic and concrete repository dependencies in controllers.
6. Register the service in `CinemaR.Api/DependencyInjection.cs` and the repository in `CinemaR.Infrastructure/DependencyInjection.cs`. Add regression tests for meaningful rules or persistence changes.

Use direct service calls and constructor injection. Small request-to-command mappings are written explicitly. No mapping library or command dispatch framework is needed. Response DTOs live in Application rather than an additional Contracts project because there is currently one HTTP host and no separate .NET client that needs a shared package.

Domain entities currently remain simple models. Introduce richer entities, aggregates, domain events, or separate bounded contexts only when business rules justify them. A project per layer gives useful compile-time separation without creating a project for every entity or feature.

## Run and verify

From the repository root:

```powershell
dotnet restore CinemaR.slnx --locked-mode
dotnet build CinemaR.slnx --no-restore
dotnet test CinemaR.slnx --no-restore
dotnet run --project src/backend/CinemaR.Api --launch-profile http
```

The solution's fast tests do not connect to a live database. They cover showtimes boundaries across Kyiv clock changes, command validation, booking request identity, seat-map timing, administration write rules, dependency direction, and the EF migration snapshot. Run `./scripts/test-postgres.ps1` for the separate PostgreSQL 18 integration suite covering persistence, concurrency, Identity HTTP authorization, and migration execution. See [testing](testing.md) for coverage and remaining gaps. For manual checks, run PostgreSQL through Compose and exercise the showtimes, seat maps, bookings, and administration flows.

## EF migrations

The startup project is API; the context and migrations belong to Infrastructure:

```powershell
dotnet ef migrations add DescribeChange --project src/backend/CinemaR.Infrastructure --startup-project src/backend/CinemaR.Api --output-dir Data/Migrations -- --environment Development
dotnet ef migrations script --idempotent --project src/backend/CinemaR.Infrastructure --startup-project src/backend/CinemaR.Api --output cinemaR-migrations.sql -- --environment Development
dotnet ef migrations has-pending-model-changes --project src/backend/CinemaR.Infrastructure --startup-project src/backend/CinemaR.Api -- --environment Development
```

Existing migration IDs, rows, seed markers, and SQL constraints are preserved. `CinemaRSchema` moves the former `catalog` tables to quoted `"cinemaR"`. `CinemaRHistoryRepository` relocates legacy EF history before migration discovery, including EF tooling and idempotent scripts; it refuses ambiguous dual histories. Booking and identity retain their own schemas. Development startup still applies migrations and one-time seeds; other environments require explicit migration deployment and connection configuration.
