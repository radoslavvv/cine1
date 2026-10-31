namespace CinemaR.Application.Showtimes.Contracts;

public sealed record AdminShowtime(int Id, int MovieId, string MovieTitle, int AuditoriumId,
    string AuditoriumName, DateTime StartsAt, DateTime OccupiedUntil, int DurationMinutes,
    string Format, bool IsCancelled, int BookingCount);
