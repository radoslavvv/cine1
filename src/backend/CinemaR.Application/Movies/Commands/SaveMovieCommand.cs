namespace CinemaR.Application.Movies.Commands;

public sealed record SaveMovieCommand(
    string Title,
    int DurationMinutes,
    string[] Genres,
    string Synopsis,
    string? PosterUrl, string? BackdropUrl);
