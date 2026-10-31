using CinemaR.Infrastructure.Data.Contexts;
using Microsoft.EntityFrameworkCore;

namespace CinemaR.Infrastructure.Data.Transactions;

// Management writes need stable cinema data while checking referenced bookings and layouts.
// Shared booking locks still allow different screenings to confirm concurrently.
public static class CinemaRWriteLock
{
    public static Task ExclusiveAsync(CinemaRDbContext db, CancellationToken ct)
    {
        return db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(73190422)", ct);
    }

    public static Task SharedAsync(CinemaRDbContext db, CancellationToken ct)
    {
        return db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock_shared(73190422)", ct);
    }
}
