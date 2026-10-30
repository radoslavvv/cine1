using Cinema.Api.Booking.Contracts;
using Cinema.Api.Booking.Repositories;

namespace Cinema.Api.Booking.Services;

public sealed class SeatMapService(ISeatMapRepository repository, TimeProvider clock) : ISeatMapService
{
    public async Task<SeatMapResponse?> GetAsync(int showtimeId, CancellationToken cancellationToken)
    {
        var map = await repository.GetAsync(showtimeId, cancellationToken);
        if (map is null) return null;
        var now = clock.GetUtcNow().UtcDateTime;
        return new SeatMapResponse(map.ShowtimeId, map.StartsAt, now, map.StartsAt > now,
            new SeatMapMovie(map.MovieId, map.MovieTitle, map.DurationMinutes, map.Genres, map.PosterUrl, map.BackdropUrl),
            new SeatMapAuditorium(map.AuditoriumId, map.AuditoriumName),
            map.Seats.Select(seat => new SeatResponse(seat.Id, seat.RowLabel, seat.Number, seat.GridRow, seat.GridColumn, seat.Taken)).ToArray());
    }
}
