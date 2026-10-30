using Cinema.Application.Booking.Contracts;

namespace Cinema.Application.Booking.Results;

public sealed record BookingResult(BookingOutcome Outcome, BookingConfirmation? Confirmation = null);
