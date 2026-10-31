using CinemaR.Application.Showtimes.Queries;
using CinemaR.Application.Movies.Responses;
using CinemaR.Application.Auditoriums.Responses;
using CinemaR.Application.Showtimes.Results;
using CinemaR.Domain.Showtimes;
using CinemaR.Application.Showtimes.Responses;
using CinemaR.Application.Showtimes.Repositories;

namespace CinemaR.Application.Showtimes.Services;

public sealed class ShowtimesService(IShowtimeRepository repository) : IShowtimesService
{
    public async Task<ShowtimesResult> GetForDateAsync(GetShowtimesQuery query, CancellationToken cancellationToken)
    {
        var (date, genre, format) = query;

        if (date is null || date < new DateOnly(1900, 1, 1) || date > new DateOnly(9998, 12, 31))
        {
            return new ShowtimesResult([], "Use ?date=YYYY-MM-DD&format=2D (1900–9998). Dates are interpreted in Europe/Kyiv.");
        }

        if (format is not ("2D" or "3D" or "IMAX 2D" or "IMAX 3D"))
        {
            return new ShowtimesResult([], "A format is required: 2D, 3D, IMAX 2D, or IMAX 3D.");
        }

        var (start, end) = CinemaCalendar.DayBounds(date.Value);

        var showtimes = await repository.GetForIntervalAsync(start, end, string.IsNullOrWhiteSpace(genre) ? null : genre.Trim(), format, cancellationToken);

        return new ShowtimesResult(showtimes
            .Select(showtime => new ShowtimeResponse(
            showtime.Id, showtime.StartsAt,
            new MovieResponse(showtime.MovieId, showtime.Title, showtime.DurationMinutes, showtime.Genres, showtime.Synopsis, showtime.PosterUrl, showtime.BackdropUrl),
            new AuditoriumResponse(showtime.AuditoriumId, showtime.AuditoriumName), showtime.Format))
            .ToArray());
    }
}
