using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Booking.ReadModels;
using CinemaR.Application.Booking.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CinemaR.Infrastructure.Data.Repositories;

public sealed class SeatMapRepository(CinemaRDbContext db) : ISeatMapRepository
{
    public async Task<SeatMapReadModel?> GetAsync(int showtimeId, CancellationToken cancellationToken)
    {
        var showtime = await db.Showtimes.AsNoTracking()
            .Where(showtime => showtime.Id == showtimeId && showtime.CancelledAt == null)
            .Select(showtime => new
            {
                showtime.Id,
                showtime.StartsAt,
                showtime.MovieId,
                showtime.Movie.Title,
                DurationMinutes = showtime.ScheduledDurationMinutes,
                showtime.Movie.PosterUrl,
                showtime.Movie.BackdropUrl,
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
            showtime.AuditoriumId, showtime.Name, seats, showtime.PosterUrl, showtime.BackdropUrl);
    }
}
