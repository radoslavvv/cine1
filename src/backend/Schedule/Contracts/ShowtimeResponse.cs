namespace Cinema.Api.Schedule.Contracts;

public sealed record ShowtimeResponse(int Id, DateTime StartsAt, MovieResponse Movie, AuditoriumResponse Auditorium, string Format);
public sealed record MovieResponse(int Id, string Title, int DurationMinutes, string[] Genres, string Synopsis);
public sealed record AuditoriumResponse(int Id, string Name);

public sealed record ScheduleResult(IReadOnlyList<ShowtimeResponse> Showtimes, string? ValidationError = null);
