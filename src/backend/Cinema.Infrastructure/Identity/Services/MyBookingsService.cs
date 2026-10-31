using Cinema.Application.Identity.Contracts;
using Cinema.Application.Identity.Services;
using Cinema.Infrastructure.Data;
using Cinema.Infrastructure.Data.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Infrastructure.Identity.Services;

public sealed class MyBookingsService(CinemaRDbContext db) : IMyBookingsService
{
    public async Task<BookingHistory> FindAsync(string customerId, int page, CancellationToken cancellationToken)
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
