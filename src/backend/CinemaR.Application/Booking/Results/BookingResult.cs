using CinemaR.Application.Booking.Contracts;

namespace CinemaR.Application.Booking.Results;

public sealed record BookingResult(BookingOutcome Outcome, BookingConfirmation? Confirmation = null);
