namespace CinemaR.Application.Movies.Contracts;

public sealed record MovieResponse(int Id, string Title, int DurationMinutes, string[] Genres, string Synopsis, string? PosterUrl = null, string? BackdropUrl = null);
