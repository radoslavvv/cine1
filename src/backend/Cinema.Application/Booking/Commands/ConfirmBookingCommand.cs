namespace Cinema.Application.Booking.Commands;

public sealed record ConfirmBookingCommand(int ShowtimeId, Guid RequestId, string Email, int[] SeatIds, string? CustomerId = null);
