namespace CinemaR.Application.Booking.Responses;

public sealed record AdminBookingResponse(Guid Id, string Email, DateTime ConfirmedAt, int ShowtimeId,
    string MovieTitle, string AuditoriumName, DateTime StartsAt, bool IsCancelled, IReadOnlyList<string> Seats);
