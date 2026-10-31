namespace CinemaR.Application.Booking.Contracts;

public sealed record BookingPage(int Page, int PageSize, int Total, IReadOnlyList<AdminBooking> Items);
