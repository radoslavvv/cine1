using CinemaR.Infrastructure.Data.Contexts;
using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Booking.Services;
using CinemaR.Application.Booking.Responses;
using CinemaR.Application.Identity.Responses;
using CinemaR.Application.Identity.Services;
using Microsoft.EntityFrameworkCore;

using CinemaR.Application.Booking.Repositories;
namespace CinemaR.Infrastructure.Data.Repositories;

public sealed class MyBookingsRepository(CinemaRDbContext db) : IMyBookingsRepository
{
    public async Task<BookingHistoryResponse> FindForCustomerAsync(string customerId, int page, CancellationToken cancellationToken)
    {
        const int pageSize = 20;
        var bookings = await db.Bookings.AsNoTracking().Where(booking => booking.CustomerId == customerId)
            .OrderByDescending(booking => booking.ConfirmedAt).ThenBy(booking => booking.Id)
            .Skip((page - 1) * pageSize).Take(pageSize + 1)
            .Include(booking => booking.Showtime).ThenInclude(showtime => showtime.Movie)
            .Include(booking => booking.Showtime).ThenInclude(showtime => showtime.Auditorium)
            .Include(booking => booking.Seats).ThenInclude(seat => seat.Seat)
            .ToArrayAsync(cancellationToken);
        return new(bookings.Take(pageSize).Select(BookingRepository.ToConfirmation).ToArray(), page, bookings.Length > pageSize);
    }
}
