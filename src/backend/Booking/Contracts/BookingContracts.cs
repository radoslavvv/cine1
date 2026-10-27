using System.ComponentModel.DataAnnotations;

namespace Cinema.Api.Booking.Contracts;

public sealed record ConfirmBookingRequest(
    Guid RequestId,
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(1), MaxLength(8)] int[] SeatIds);

public sealed record BookingConfirmation(
    string ConfirmationToken, DateTime ConfirmedAt, string Email, int ShowtimeId,
    DateTime StartsAt, string MovieTitle, string AuditoriumName, IReadOnlyList<TicketResponse> Tickets);

public sealed record TicketResponse(int SeatId, string RowLabel, int Number);
