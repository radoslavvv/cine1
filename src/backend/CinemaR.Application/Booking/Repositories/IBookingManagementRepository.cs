using CinemaR.Application.Booking.Queries;
using CinemaR.Application.Booking.Responses;

namespace CinemaR.Application.Booking.Repositories;

public interface IBookingManagementRepository
{
    Task<BookingPageResponse> BookingsAsync(GetBookingsQuery filters, CancellationToken ct);

    Task<AdminBookingResponse> BookingAsync(Guid id, CancellationToken ct);
}
