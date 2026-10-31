namespace CinemaR.Application.Booking.Contracts;

public sealed record BookingConfirmation(
    string ConfirmationToken, DateTime ConfirmedAt, string Email, int ShowtimeId,
    DateTime StartsAt, string MovieTitle, string AuditoriumName, IReadOnlyList<TicketResponse> Tickets, bool IsCancelled = false);
