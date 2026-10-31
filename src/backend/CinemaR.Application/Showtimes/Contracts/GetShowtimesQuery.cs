namespace CinemaR.Application.Showtimes.Contracts;

public sealed record GetShowtimesQuery(DateOnly? Date, string? Genre, string? Format);
