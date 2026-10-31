using CinemaR.Domain.Auditoriums;
namespace CinemaR.Application.Booking.Contracts;

public sealed record SeatMapResponse(
    int ShowtimeId, DateTime StartsAt, DateTime ServerNow, bool SelectionOpen,
    SeatMapMovie Movie, SeatMapAuditorium Auditorium, IReadOnlyList<SeatResponse> Seats);
