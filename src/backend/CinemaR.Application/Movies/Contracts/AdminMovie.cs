namespace CinemaR.Application.Movies.Contracts;

public sealed record AdminMovie(int Id, string Title, int DurationMinutes, string[] Genres,
    string Synopsis, string? PosterUrl, string? BackdropUrl, bool IsArchived, bool IsUsed);
