using CinemaR.Infrastructure.Data.Entities;
using CinemaR.Infrastructure.Data.Contexts;
using CinemaR.Domain.Auditoriums;
using CinemaR.Domain.Showtimes;
using Microsoft.EntityFrameworkCore;

namespace CinemaR.Infrastructure.Data.Seeding;

public static class SeatLayoutSeed
{
    private const string Version = "auditorium-layouts-v1";

    public static async Task RunAsync(CinemaRDbContext db, CancellationToken cancellationToken)
    {
        if (await db.SeedHistory.AnyAsync(seed => seed.Name == Version, cancellationToken)) return;
        await using var transaction = db.Database.CurrentTransaction is null
            ? await db.Database.BeginTransactionAsync(cancellationToken) : null;

        // Only populate the known sample auditoriums; preserve any existing custom layout.
        for (var roomNumber = 1; roomNumber <= 3; roomNumber++)
        {
            var name = $"Auditorium {roomNumber}";
            var room = await db.Auditoriums.SingleOrDefaultAsync(room => room.Name == name, cancellationToken);
            if (room is null || await db.Seats.AnyAsync(seat => seat.AuditoriumId == room.Id, cancellationToken)) continue;
            var rows = 4 + roomNumber * 2;
            var seatsPerRow = 8 + roomNumber * 2;
            for (var row = 0; row < rows; row++)
            {
                // Shorter front rows, a central aisle, and (in the largest room) a cross aisle.
                var inset = row < 2 ? 1 : 0;
                for (var column = inset; column < seatsPerRow - inset; column++)
                {
                    db.Seats.Add(new Seat
                    {
                        Auditorium = room,
                        RowLabel = ((char)('A' + row)).ToString(),
                        Number = column - inset + 1,
                        GridRow = row + (roomNumber == 3 && row >= 5 ? 1 : 0),
                        GridColumn = column + (column >= seatsPerRow / 2 ? 1 : 0)
                    });
                }
            }
        }
        db.SeedHistory.Add(new SeedHistory { Name = Version, AppliedAt = DateTime.UtcNow });
        await db.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
    }
}
