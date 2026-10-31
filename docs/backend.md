# Backend guide

The backend uses a small Clean/Onion-style architecture with four projects. It borrows the inward dependency rule without adding a mediator, event bus, generic repository, or full DDD aggregate model. Features remain grouped by cinema concepts inside each project.

## Projects and dependencies

- `Cinema.Domain` contains movies, auditoriums, seats, screenings, confirmed bookings, and Kyiv calendar rules. It references no other project or framework package.
- `Cinema.Application` references Domain. It owns use-case services, commands and queries, result/response models, repository interfaces, validation, and administration rules.
- `Cinema.Infrastructure` references Application (and receives Domain transitively). It implements repository interfaces with EF Core/PostgreSQL, including migrations, seed data, database health, and atomic write operations.
- `Cinema.Api` references Application and Infrastructure. It is the composition root: HTTP routing, binding, request validation, mapping, Problem Details, QR image rendering, and dependency registration live here. Controllers depend on application service interfaces.

The dependency direction is `API → Application → Domain` and `API → Infrastructure → Application`. Domain and Application cannot reference EF, ASP.NET, or Infrastructure. Tests enforce these boundaries.

## Following a request

A schedule request flows through `ShowtimesController → GetScheduleQuery → IScheduleService → IShowtimeRepository → EF Core`. The repository returns materialized read models; the service composes the response. SQL filtering stays in Infrastructure. `IQueryable` and EF-specific types never appear in application interfaces.

Booking confirmation flows through `ConfirmBookingRequest → ConfirmBookingCommand → IBookingService → IBookingRepository`. HTTP annotations validate the request shape. Application rules validate the command before persistence. The repository finalizes the booking within its existing PostgreSQL transaction, screening row lock, uniqueness constraints, and idempotency handling.

Administration flows through HTTP request models to `SaveMovieCommand`, `SaveAuditoriumCommand`, or `SaveShowtimesCommand`, then `IAdminService`. The service normalizes input and applies business rules. `IAdminRepository.ExecuteWriteAsync` executes the service's write callback under a transaction and exclusive catalog lock, so availability checks and updates remain atomic. Entities returned by repository write methods are tracked only inside that operation. Materialized read/response models serve queries. The service may flush changes to obtain generated IDs; Infrastructure commits only after the entire callback succeeds. A failed batch rolls back all changes.

Infrastructure translates known PostgreSQL write conflicts into application failures. The API maps validation, missing records, and conflicts to HTTP 400, 404, and 409. Application errors do not carry HTTP status codes. Administration requires the verified administrator account in every environment.

Accounts flow through `AccountsController → IAccountService → AccountService`, backed by ASP.NET Core Identity in Infrastructure and the `identity` schema. Cookies, CSRF validation, API challenges, authorization policies, and account rate limits are configured in `Cinema.Api/Security.cs`. Customer booking history is filtered by the authenticated customer's ID through `IMyBookingsService`; no email-based claiming occurs. See [authentication](authentication-design.md) for setup and session/ownership rules.

## File organization

Keep one C# type per file, with the filename matching the type name. This includes classes, interfaces, records, enums, commands, requests, responses, and read models. Keep related files together in their feature folder. `Repositories` in Application contains repository interfaces only. Persistence read models belong in the feature’s `ReadModels` folder; operation outcomes and result records belong in `Results`. Infrastructure’s `Data/Repositories` contains the EF implementations. The EF context is named `CinemaRDbContext`.

Test helpers live in individual files under `tests/Cinema.Tests/Support`. EF-generated migration and designer files retain their tooling conventions.

Admin groups its application types into `Commands`, `Contracts`, `Services`, `Validation`, `Results`, `Repositories`, and `ReadModels`. Identity uses `Contracts`, `Results`, and `Services` in Application; Infrastructure separates `Authentication`, `Email`, `Entities`, `Services`, and `Setup`, with feature registration at its root. Namespaces follow these folders. HTTP exception filters live under `Cinema.Api/Admin/Filters`.

## Adding a feature

1. Add domain concepts/rules only when they represent cinema behavior independent of storage or HTTP.
2. Add an application service operation and a command for a write, or a query for a read with multiple filters. Use simple IDs for straightforward lookups and actions. Keep responses as explicit records.
3. Define only the persistence operations that use case needs. Prefer feature-specific repository methods to a generic CRUD repository. Keep query projections and SQL concerns in Infrastructure.
4. Implement the repository and preserve transaction boundaries around rules that depend on current database state.
5. Bind an HTTP request in the API, map it to the application input, call the service, and translate the result to HTTP. Avoid business logic and concrete repository dependencies in controllers.
6. Register the service in the API and the repository in Infrastructure. Add regression tests for meaningful rules or persistence changes.

Use direct service calls and constructor injection. Small request-to-command mappings are written explicitly. No mapping library or command dispatch framework is needed. Response DTOs live in Application rather than an additional Contracts project because there is currently one HTTP host and no separate .NET client that needs a shared package.

Domain entities currently remain simple models. Introduce richer entities, aggregates, domain events, or separate bounded contexts only when business rules justify them. A project per layer gives useful compile-time separation without creating a project for every entity or feature.

## Run and verify

From the repository root:

```powershell
dotnet restore Cinema.slnx --locked-mode
dotnet build Cinema.slnx --no-restore
dotnet test Cinema.slnx --no-restore
dotnet run --project src/backend/Cinema.Api --launch-profile http
```

Tests do not connect to a live database. They cover schedule boundaries across Kyiv clock changes, command validation, booking request identity, seat-map timing, administration write rules, dependency direction, and the EF migration snapshot. For manual checks, run PostgreSQL through Compose and exercise the schedule, seat maps, bookings, and administration flows.

## EF migrations

The startup project is API; the context and migrations belong to Infrastructure:

```powershell
dotnet ef migrations add DescribeChange --project src/backend/Cinema.Infrastructure --startup-project src/backend/Cinema.Api --output-dir Data/Migrations -- --environment Development
dotnet ef migrations script --idempotent --project src/backend/Cinema.Infrastructure --startup-project src/backend/Cinema.Api --output catalog-migrations.sql -- --environment Development
dotnet ef migrations has-pending-model-changes --project src/backend/Cinema.Infrastructure --startup-project src/backend/Cinema.Api -- --environment Development
```

Existing migration IDs, tables, history schema, seeds, and SQL constraints are preserved. Moving the projects does not require a database reset or a new migration. Keep custom exclusion-constraint SQL when adding future migrations. Development startup still applies migrations and one-time seeds; other environments require explicit migration deployment and connection configuration.
