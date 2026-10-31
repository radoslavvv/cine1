using CinemaR.Application.Booking.Contracts;

namespace CinemaR.Application.Booking.Services;

public interface IBookingManagementService
{
    Task<AdminBooking> BookingAsync(Guid id, CancellationToken ct);
    Task<BookingPage> BookingsAsync(BookingFilters filters, CancellationToken ct);
}
