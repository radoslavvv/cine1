namespace CinemaR.Application.Showtimes.Responses;

public sealed record AdminShowtimeResponse(int Id, int MovieId, string MovieTitle, int AuditoriumId,
    string AuditoriumName, DateTime StartsAt, DateTime OccupiedUntil, int DurationMinutes,
    string Format, bool IsCancelled, int BookingCount);
