using CinemaR.Application.Booking.Contracts;
using CinemaR.Application.Admin.Results;
using CinemaR.Application.Admin.Validation;

using CinemaR.Application.Booking.Repositories;

namespace CinemaR.Application.Booking.Services;

public sealed class BookingManagementService(IBookingManagementRepository repository) : IBookingManagementService
{
    public Task<AdminBooking> BookingAsync(Guid id, CancellationToken ct) => repository.BookingAsync(id, ct);

    public Task<BookingPage> BookingsAsync(BookingFilters filters, CancellationToken ct)
    {
        if (filters.Page < 1 || filters.Page > 1000000) throw new AdminRuleException("Invalid page number.", AdminFailure.Validation);
        if (filters.Status is not (null or "" or "active" or "cancelled")) throw new AdminRuleException("Unknown booking status.", AdminFailure.Validation);
        if (!string.IsNullOrEmpty(filters.Date)) AdminValidation.Date(filters.Date);
        return repository.BookingsAsync(filters, ct);
    }

}
