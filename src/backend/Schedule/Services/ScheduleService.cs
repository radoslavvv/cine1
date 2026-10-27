using Cinema.Api.Schedule.Contracts;
using Cinema.Api.Schedule.Repositories;

namespace Cinema.Api.Schedule.Services;

public sealed class ScheduleService(IShowtimeRepository repository) : IScheduleService
{
    public async Task<ScheduleResult> GetForDateAsync(DateOnly? date, string? genre, string? format, CancellationToken cancellationToken)
    {
        if (date is null || date < new DateOnly(1900, 1, 1) || date > new DateOnly(9998, 12, 31))
            return new ScheduleResult([], "Use ?date=YYYY-MM-DD&format=2D (1900–9998). Dates are interpreted in Europe/Kyiv.");

        if (format is not ("2D" or "3D" or "IMAX 2D" or "IMAX 3D"))
            return new ScheduleResult([], "A format is required: 2D, 3D, IMAX 2D, or IMAX 3D.");

        var (start, end) = CinemaCalendar.DayBounds(date.Value);
        var showtimes = await repository.GetForIntervalAsync(start, end, string.IsNullOrWhiteSpace(genre) ? null : genre.Trim(), format, cancellationToken);
        return new ScheduleResult(showtimes.Select(showtime => new ShowtimeResponse(
            showtime.Id, showtime.StartsAt,
            new MovieResponse(showtime.MovieId, showtime.Title, showtime.DurationMinutes, showtime.Genres, showtime.Synopsis),
            new AuditoriumResponse(showtime.AuditoriumId, showtime.AuditoriumName), showtime.Format)).ToArray());
    }
}
