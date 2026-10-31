using CinemaR.Application.Booking.Queries;
using CinemaR.Application.Booking.Responses;

namespace CinemaR.Application.Booking.Services;

public interface IBookingManagementService
{
    Task<AdminBookingResponse> BookingAsync(Guid id, CancellationToken ct);
    Task<BookingPageResponse> BookingsAsync(GetBookingsQuery filters, CancellationToken ct);
}
