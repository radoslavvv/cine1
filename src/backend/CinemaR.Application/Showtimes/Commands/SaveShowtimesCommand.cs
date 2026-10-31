namespace CinemaR.Application.Showtimes.Commands;

public sealed record SaveShowtimesCommand(
    int MovieId, int AuditoriumId,
    string Format, string LocalTime,
    string[] Dates);
