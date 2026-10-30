using Cinema.Application.Schedule.Contracts;

namespace Cinema.Application.Schedule.Results;

public sealed record ScheduleResult(IReadOnlyList<ShowtimeResponse> Showtimes, string? ValidationError = null);
