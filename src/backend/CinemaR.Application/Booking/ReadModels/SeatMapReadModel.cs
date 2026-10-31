namespace CinemaR.Application.Booking.ReadModels;

public sealed record SeatMapReadModel(
    int ShowtimeId, DateTime StartsAt, int MovieId, string MovieTitle, int DurationMinutes,
    string[] Genres, int AuditoriumId, string AuditoriumName, IReadOnlyList<SeatReadModel> Seats, string? PosterUrl = null, string? BackdropUrl = null);
