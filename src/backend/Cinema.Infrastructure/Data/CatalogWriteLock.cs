using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Data;

// Admin writes need a stable catalog while checking referenced bookings and layouts.
// Shared booking locks still allow different screenings to confirm concurrently.
public static class CatalogWriteLock
{
    public static Task ExclusiveAsync(CinemaRDbContext db, CancellationToken ct) =>
        db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(73190422)", ct);

    public static Task SharedAsync(CinemaRDbContext db, CancellationToken ct) =>
        db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock_shared(73190422)", ct);
}
