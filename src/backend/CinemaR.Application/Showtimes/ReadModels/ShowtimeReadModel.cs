namespace CinemaR.Application.Showtimes.ReadModels;

// Materialized query data, independent of EF entities and the HTTP response contract.
public sealed record ShowtimeReadModel(
    int Id, DateTime StartsAt,
    int MovieId, string Title, int DurationMinutes, string[] Genres, string Synopsis,
    int AuditoriumId, string AuditoriumName, string Format, string? PosterUrl = null, string? BackdropUrl = null);
