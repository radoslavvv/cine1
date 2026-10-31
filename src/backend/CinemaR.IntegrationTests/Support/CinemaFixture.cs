using CinemaR.Application.Booking.Commands;
using CinemaR.Application.Booking.Responses;
using CinemaR.Application.Booking.Results;
using CinemaR.Application.Booking.Services;
using CinemaR.Application.SeatMaps.Services;
using CinemaR.Application.SeatMaps.Responses;
using CinemaR.Domain.Auditoriums;
using CinemaR.Domain.Movies;
using CinemaR.Domain.Showtimes;
using CinemaR.Infrastructure.Data.Repositories;

namespace CinemaR.IntegrationTests.Support;

internal sealed class CinemaFixture(PostgresDatabase database)
{
    public TestClock Clock { get; } = new();
    public int ShowtimeId { get; private set; }
    public int OtherShowtimeId { get; private set; }
    public int MovieId { get; private set; }
    public int AuditoriumId { get; private set; }
    public int[] SeatIds { get; private set; } = [];
    public int ForeignSeatId { get; private set; }

    public async Task SeedAsync()
    {
        await using var db = database.OpenContext();
        var movie = new Movie { Title = "Test film", DurationMinutes = 100, Genres = ["Drama"], Synopsis = "Fixture" };
        var room = new Auditorium { Name = "Test room", SupportedFormats = ["2D", "3D"] };
        var otherRoom = new Auditorium { Name = "Other room" };
        db.AddRange(movie, room, otherRoom);
        var seats = Enumerable.Range(1, 4).Select(number => new Seat
        {
            Auditorium = room,
            RowLabel = "A",
            Number = number,
            GridRow = 0,
            GridColumn = number - 1
        }).ToArray();
        var foreignSeat = new Seat { Auditorium = otherRoom, RowLabel = "A", Number = 1, GridRow = 0, GridColumn = 0 };
        db.AddRange(seats);
        db.Add(foreignSeat);
        var showtime = new Showtime
        {
            Movie = movie,
            Auditorium = room,
            StartsAt = Clock.Now.UtcDateTime.AddDays(1),
            OccupiedUntil = Clock.Now.UtcDateTime.AddDays(1).AddMinutes(115)
        };
        var otherShowtime = new Showtime
        {
            Movie = movie,
            Auditorium = room,
            StartsAt = Clock.Now.UtcDateTime.AddDays(2),
            OccupiedUntil = Clock.Now.UtcDateTime.AddDays(2).AddMinutes(115)
        };
        db.AddRange(showtime, otherShowtime);
        await db.SaveChangesAsync();
        ShowtimeId = showtime.Id;
        OtherShowtimeId = otherShowtime.Id;
        MovieId = movie.Id;
        AuditoriumId = room.Id;
        SeatIds = seats.Select(seat => seat.Id).ToArray();
        ForeignSeatId = foreignSeat.Id;
    }

    public async Task<BookingResult> BookAsync(int[] seats, Guid? requestId = null,
        string email = "guest@example.test", string? customerId = null, int? showtimeId = null)
    {
        await using var db = database.OpenContext();
        return await new BookingService(new BookingRepository(db, Clock)).ConfirmAsync(
            new ConfirmBookingCommand(showtimeId ?? ShowtimeId, requestId ?? Guid.NewGuid(), email, seats, customerId), CancellationToken.None);
    }

    public async Task<SeatMapResponse?> SeatsAsync()
    {
        await using var db = database.OpenContext();
        return await new SeatMapService(new SeatMapRepository(db), Clock).GetAsync(ShowtimeId, CancellationToken.None);
    }

    public async Task<BookingConfirmationResponse?> FindAsync(string token)
    {
        await using var db = database.OpenContext();
        return await new BookingService(new BookingRepository(db, Clock)).FindAsync(token, CancellationToken.None);
    }
}
