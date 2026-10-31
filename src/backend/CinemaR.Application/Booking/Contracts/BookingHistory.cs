using CinemaR.Application.Booking.Contracts;

namespace CinemaR.Application.Booking.Contracts;

public sealed record BookingHistory(BookingConfirmation[] Items, int Page, bool HasMore);
