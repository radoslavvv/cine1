using CinemaR.Application.Admin.Exceptions;
using CinemaR.Application.Booking.Queries;
using CinemaR.Application.Booking.Responses;
using CinemaR.Application.Admin.Results;
using CinemaR.Application.Admin.Validation;

using CinemaR.Application.Booking.Repositories;

namespace CinemaR.Application.Booking.Services;

public sealed class BookingManagementService(IBookingManagementRepository repository) : IBookingManagementService
{
    public Task<AdminBookingResponse> BookingAsync(Guid id, CancellationToken ct)
    {
        return repository.BookingAsync(id, ct);
    }

    public Task<BookingPageResponse> BookingsAsync(GetBookingsQuery filters, CancellationToken ct)
    {
        if (filters.Page < 1 || filters.Page > 1000000)
        {
            throw new AdminRuleException("Invalid page number.", AdminFailure.Validation);
        }

        if (filters.Status is not (null or "" or "active" or "cancelled"))
        {
            throw new AdminRuleException("Unknown booking status.", AdminFailure.Validation);
        }

        if (!string.IsNullOrEmpty(filters.Date))
        {
            AdminValidation.Date(filters.Date);
        }

        return repository.BookingsAsync(filters, ct);
    }

}
