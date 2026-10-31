using CinemaR.Application.Booking.Responses;

namespace CinemaR.Application.Booking.Results;

public sealed record BookingResult(BookingOutcome Outcome, BookingConfirmationResponse? Confirmation = null);
