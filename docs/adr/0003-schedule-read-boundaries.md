# Put schedule reads behind a service and repository

The public page browses a dated schedule, so expose only the showtimes read endpoint and remove the unused standalone movie catalog endpoint/query. Keep Movie as an independent backend domain concept; its current frontend artwork and response types belong to Schedule, their only consumer.

The controller handles HTTP, IScheduleService validates cinema dates and composes response DTOs, and IShowtimeRepository retrieves a UTC interval through EF Core. The repository returns materialized read models rather than EF entities or IQueryable, keeping query execution in persistence and preventing database model changes from silently changing the HTTP contract. Retain the existing flat showtime response to preserve the frontend contract; add further repositories/services when an actual use case needs them.
