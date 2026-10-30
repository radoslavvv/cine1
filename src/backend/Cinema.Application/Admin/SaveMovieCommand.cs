namespace Cinema.Application.Admin;

public sealed record SaveMovieCommand(
    string Title,
    int DurationMinutes,
    string[] Genres,
    string Synopsis,
    string? PosterUrl, string? BackdropUrl);
