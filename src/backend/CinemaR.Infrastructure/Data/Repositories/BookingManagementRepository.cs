using CinemaR.Application.Admin.Exceptions;
using CinemaR.Application.Booking.Queries;
using CinemaR.Infrastructure.Data.Contexts;
using CinemaR.Application.Booking.Responses;
using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Admin.Results;
using CinemaR.Application.Admin.Validation;
using CinemaR.Domain.Booking;
using CinemaR.Domain.Movies;
using CinemaR.Domain.Showtimes;
using Microsoft.EntityFrameworkCore;
using Npgsql;

using CinemaR.Application.Booking.Repositories;
namespace CinemaR.Infrastructure.Data.Repositories;

public sealed class BookingManagementRepository(CinemaRDbContext db) : IBookingManagementRepository
{
    public async Task<BookingPageResponse> BookingsAsync(GetBookingsQuery filters, CancellationToken ct)
    {
        var query = db.Bookings.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var search = filters.Search.Trim();
            var isId = Guid.TryParse(search, out var bookingId);
            query = query.Where(b => b.Email.ToLower().Contains(search.ToLower()) || (isId && b.Id == bookingId));
        }
        if (!string.IsNullOrEmpty(filters.Date))
        {
            var (start, end) = CinemaCalendar.DayBounds(AdminValidation.Date(filters.Date));
            query = query.Where(b => b.Showtime.StartsAt >= start && b.Showtime.StartsAt < end);
        }
        if (filters.MovieId is not null) query = query.Where(b => b.Showtime.MovieId == filters.MovieId);
        if (filters.AuditoriumId is not null) query = query.Where(b => b.Showtime.AuditoriumId == filters.AuditoriumId);
        if (filters.Status == "active") query = query.Where(b => b.Showtime.CancelledAt == null);
        if (filters.Status == "cancelled") query = query.Where(b => b.Showtime.CancelledAt != null);
        var total = await query.CountAsync(ct);
        var items = await BookingDetails(query.OrderByDescending(b => b.ConfirmedAt).ThenBy(b => b.Id)
            .Skip((filters.Page - 1) * 25).Take(25)).ToListAsync(ct);
        return new(filters.Page, 25, total, items);
    }

    public async Task<AdminBookingResponse> BookingAsync(Guid id, CancellationToken ct) =>
        await BookingDetails(db.Bookings.AsNoTracking().Where(b => b.Id == id)).SingleOrDefaultAsync(ct) ?? throw Missing();

    private static IQueryable<AdminBookingResponse> BookingDetails(IQueryable<ConfirmedBooking> query) => query.Select(b =>
        new AdminBookingResponse(b.Id, b.Email, b.ConfirmedAt, b.ShowtimeId, b.Showtime.Movie.Title,
            b.Showtime.Auditorium.Name, b.Showtime.StartsAt, b.Showtime.CancelledAt != null,
            b.Seats.OrderBy(s => s.Seat.GridRow).ThenBy(s => s.Seat.GridColumn)
                .Select(s => s.Seat.RowLabel + s.Seat.Number).ToList()));

    private static AdminRuleException Missing() => new("Record not found.", AdminFailure.NotFound);
}
