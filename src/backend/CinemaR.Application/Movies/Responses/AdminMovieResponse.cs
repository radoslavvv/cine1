namespace CinemaR.Application.Movies.Responses;

public sealed record AdminMovieResponse(int Id, string Title, int DurationMinutes, string[] Genres,
    string Synopsis, string? PosterUrl, string? BackdropUrl, bool IsArchived, bool IsUsed);
