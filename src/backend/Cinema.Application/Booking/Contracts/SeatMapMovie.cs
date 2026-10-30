namespace Cinema.Application.Booking.Contracts;

public sealed record SeatMapMovie(int Id, string Title, int DurationMinutes, string[] Genres, string? PosterUrl = null, string? BackdropUrl = null);
