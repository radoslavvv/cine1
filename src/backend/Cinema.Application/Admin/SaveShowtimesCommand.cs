namespace Cinema.Application.Admin;

public sealed record SaveShowtimesCommand(
    int MovieId, int AuditoriumId,
    string Format, string LocalTime,
    string[] Dates);
