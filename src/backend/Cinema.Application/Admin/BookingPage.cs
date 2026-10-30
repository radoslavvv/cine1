namespace Cinema.Application.Admin;

public sealed record BookingPage(int Page, int PageSize, int Total, IReadOnlyList<AdminBooking> Items);
