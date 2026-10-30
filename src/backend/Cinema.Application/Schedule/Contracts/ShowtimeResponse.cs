namespace Cinema.Application.Schedule.Contracts;

public sealed record ShowtimeResponse(int Id, DateTime StartsAt, MovieResponse Movie, AuditoriumResponse Auditorium, string Format);
