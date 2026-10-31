using Cinema.Application.Booking.Contracts;

namespace Cinema.Application.Identity.Contracts;

public sealed record BookingHistory(BookingConfirmation[] Items, int Page, bool HasMore);
