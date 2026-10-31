namespace CinemaR.Application.Booking.Responses;

public sealed record BookingConfirmationResponse(
    string ConfirmationToken, DateTime ConfirmedAt, string Email, int ShowtimeId,
    DateTime StartsAt, string MovieTitle, string AuditoriumName, IReadOnlyList<TicketResponse> Tickets, bool IsCancelled = false);
