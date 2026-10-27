using Cinema.Api.Booking.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Data.Repositories;

public sealed class SeatMapRepository(CatalogDbContext db) : ISeatMapRepository
{
    public async Task<SeatMapReadModel?> GetAsync(int showtimeId, CancellationToken cancellationToken)
    {
        var showtime = await db.Showtimes.AsNoTracking()
            .Where(showtime => showtime.Id == showtimeId)
            .Select(showtime => new
            {
                showtime.Id,
                showtime.StartsAt,
                showtime.MovieId,
                showtime.Movie.Title,
                showtime.Movie.DurationMinutes,
                showtime.Movie.Genres,
                showtime.AuditoriumId,
                showtime.Auditorium.Name
            }).SingleOrDefaultAsync(cancellationToken);
        if (showtime is null) return null;
        var seats = await db.Seats.AsNoTracking()
            .Where(seat => seat.AuditoriumId == showtime.AuditoriumId)
            .OrderBy(seat => seat.GridRow).ThenBy(seat => seat.GridColumn)
            .Select(seat => new SeatReadModel(seat.Id, seat.RowLabel, seat.Number, seat.GridRow, seat.GridColumn,
                db.BookedSeats.Any(booked => booked.ShowtimeId == showtimeId && booked.SeatId == seat.Id)))
            .ToListAsync(cancellationToken);
        return new SeatMapReadModel(showtime.Id, showtime.StartsAt, showtime.MovieId,
            showtime.Title, showtime.DurationMinutes, showtime.Genres,
            showtime.AuditoriumId, showtime.Name, seats);
    }
}
