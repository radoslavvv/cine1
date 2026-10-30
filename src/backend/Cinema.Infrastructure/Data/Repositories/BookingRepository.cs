using Cinema.Application.Booking.Results;
using System.Security.Cryptography;
using Cinema.Domain.Booking;
using Cinema.Application.Booking.Contracts;
using Cinema.Application.Booking.Repositories;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Cinema.Infrastructure.Data.Repositories;

public sealed class BookingRepository(CinemaRDbContext db, TimeProvider clock) : IBookingRepository
{
    public async Task<BookingResult> ConfirmAsync(int showtimeId, Guid requestId, string email, int[] seatIds, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await CatalogWriteLock.SharedAsync(db, cancellationToken);
        // Serialize finalizations for this screening only. No seat is held while the customer checks out.
        var showtime = await db.Showtimes.FromSqlInterpolated($"SELECT * FROM catalog.showtimes WHERE id = {showtimeId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
        if (showtime is null) return new(BookingOutcome.NotFound);

        var existing = await LoadAsync().SingleOrDefaultAsync(booking => booking.Id == requestId, cancellationToken);
        if (existing is not null) return Replay(existing, showtimeId, email, seatIds);
        if (showtime.CancelledAt is not null) return new(BookingOutcome.Cancelled);
        if (showtime.StartsAt <= clock.GetUtcNow().UtcDateTime) return new(BookingOutcome.Started);

        var validSeats = await db.Seats.CountAsync(seat => seat.AuditoriumId == showtime.AuditoriumId && seatIds.Contains(seat.Id), cancellationToken);
        if (validSeats != seatIds.Length) return new(BookingOutcome.InvalidSeats);
        if (await db.BookedSeats.AnyAsync(seat => seat.ShowtimeId == showtimeId && seatIds.Contains(seat.SeatId), cancellationToken))
            return new(BookingOutcome.SeatsTaken);

        var booking = new ConfirmedBooking
        {
            Id = requestId,
            ConfirmationToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant(),
            Email = email,
            ShowtimeId = showtimeId,
            ConfirmedAt = clock.GetUtcNow().UtcDateTime,
            Seats = seatIds.Select(id => new BookedSeat
            {
                ShowtimeId = showtimeId,
                SeatId = id,
                TicketCode = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant()
            }).ToList()
        };
        // Recheck after database reads, in case the screening started while finalization was in flight.
        if (showtime.StartsAt <= booking.ConfirmedAt) return new(BookingOutcome.Started);
        db.Bookings.Add(booking);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            await transaction.RollbackAsync(cancellationToken);
            db.ChangeTracker.Clear();
            var replay = await LoadAsync().SingleOrDefaultAsync(item => item.Id == requestId, cancellationToken);
            return replay is null ? new(BookingOutcome.SeatsTaken) : Replay(replay, showtimeId, email, seatIds);
        }
        return new(BookingOutcome.Confirmed, await FindAsync(booking.ConfirmationToken, cancellationToken));
    }

    public async Task<BookingConfirmation?> FindAsync(string confirmationToken, CancellationToken cancellationToken)
    {
        if (confirmationToken.Length != 64 || !confirmationToken.All(Uri.IsHexDigit)) return null;
        var booking = await LoadAsync().SingleOrDefaultAsync(item => item.ConfirmationToken == confirmationToken, cancellationToken);
        return booking is null ? null : ToConfirmation(booking);
    }

    private IQueryable<ConfirmedBooking> LoadAsync() => db.Bookings.AsNoTracking()
        .Include(booking => booking.Showtime).ThenInclude(showtime => showtime.Movie)
        .Include(booking => booking.Showtime).ThenInclude(showtime => showtime.Auditorium)
        .Include(booking => booking.Seats).ThenInclude(seat => seat.Seat);

    private static BookingResult Replay(ConfirmedBooking booking, int showtimeId, string email, int[] seatIds) =>
        booking.ShowtimeId == showtimeId && booking.Email == email
        && booking.Seats.Select(seat => seat.SeatId).Order().SequenceEqual(seatIds.Order())
            ? new(BookingOutcome.Confirmed, ToConfirmation(booking)) : new(BookingOutcome.RequestConflict);

    private static BookingConfirmation ToConfirmation(ConfirmedBooking booking) => new(
        booking.ConfirmationToken, booking.ConfirmedAt, booking.Email, booking.ShowtimeId,
        booking.Showtime.StartsAt, booking.Showtime.Movie.Title, booking.Showtime.Auditorium.Name,
        booking.Seats.OrderBy(item => item.Seat.GridRow).ThenBy(item => item.Seat.GridColumn)
            .Select(item => new TicketResponse(item.SeatId, item.Seat.RowLabel, item.Seat.Number,
                booking.Showtime.CancelledAt is null ? item.TicketCode : "")).ToArray(), booking.Showtime.CancelledAt is not null);
}
