namespace CinemaR.Application.SeatMaps.Responses;

public sealed record SeatMapMovieResponse(int Id, string Title, int DurationMinutes, string[] Genres, string? PosterUrl = null, string? BackdropUrl = null);
