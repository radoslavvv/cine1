namespace CinemaR.Application.Showtimes.Queries;

public sealed record GetShowtimesQuery(DateOnly? Date, string? Genre, string? Format);
