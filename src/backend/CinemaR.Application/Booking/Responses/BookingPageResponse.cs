namespace CinemaR.Application.Booking.Responses;

public sealed record BookingPageResponse(int Page, int PageSize, int Total, IReadOnlyList<AdminBookingResponse> Items);
