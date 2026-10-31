namespace CinemaR.Application.SeatMaps.Responses;

public sealed record SeatMapResponse(
    int ShowtimeId, DateTime StartsAt, DateTime ServerNow, bool SelectionOpen,
    SeatMapMovieResponse Movie, SeatMapAuditoriumResponse Auditorium, IReadOnlyList<SeatResponse> Seats);
