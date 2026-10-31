using CinemaR.Application.Booking.Contracts;

namespace CinemaR.Application.Booking.Repositories;

public interface IBookingManagementRepository
{
    Task<BookingPage> BookingsAsync(BookingFilters filters, CancellationToken ct);
    Task<AdminBooking> BookingAsync(Guid id, CancellationToken ct);
}
