using CinemaR.Application.Movies.Contracts;
using CinemaR.Application.Auditoriums.Contracts;
using CinemaR.Application.Showtimes.Contracts;
using CinemaR.Application.Showtimes.ReadModels;
using CinemaR.Application.Booking.Contracts;
using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Movies.Repositories;
using CinemaR.Application.Auditoriums.Repositories;
using CinemaR.Application.Showtimes.Repositories;
using CinemaR.Application.Booking.Repositories;
using CinemaR.Domain.Movies;
using CinemaR.Domain.Showtimes;

namespace CinemaR.Tests;

internal sealed class TestAdminRepository(DateTimeOffset now) : IMovieRepository, IAuditoriumRepository, IShowtimeManagementRepository, IBookingManagementRepository
{
    public Movie Movie = new() { Id = 1, Title = "Example", DurationMinutes = 100, Genres = ["Drama"], Synopsis = "" };
    public Auditorium Room = new() { Id = 1, Name = "Room", SupportedFormats = ["2D"] };
    public Showtime Showtime = new() { Id = 1, StartsAt = now.UtcDateTime.AddDays(1) };
    public List<Showtime> AddedShowtimes = [];
    public IReadOnlyList<ShowtimeConflict> Overlaps = [];
    public bool RemainingMovieShowtimes, AuditoriumHasBookings, DeletedSeats, QueriedInsideTransaction;
    public int WriteCount;
    private bool inTransaction;
    public async Task<T> ExecuteWriteAsync<T>(Func<Task<T>> action, CancellationToken ct)
    {
        WriteCount++;
        inTransaction = true;
        try { return await action(); }
        finally { inTransaction = false; }
    }
    public Task<Movie?> FindMovieAsync(int id, CancellationToken ct) => Task.FromResult<Movie?>(Movie);
    public Task<Auditorium?> FindAuditoriumAsync(int id, CancellationToken ct) => Task.FromResult<Auditorium?>(Room);
    public Task<Showtime?> FindShowtimeAsync(int id, CancellationToken ct) => Task.FromResult<Showtime?>(Showtime);
    public Task<bool> HasRemainingMovieShowtimesAsync(int id, DateTime now, CancellationToken ct)
    {
        QueriedInsideTransaction = inTransaction;
        return Task.FromResult(RemainingMovieShowtimes);
    }
    public Task<bool> HasAuditoriumBookingsAsync(int id, CancellationToken ct)
    {
        QueriedInsideTransaction = inTransaction;
        return Task.FromResult(AuditoriumHasBookings);
    }
    public Task DeleteSeatsAsync(int id, CancellationToken ct) { DeletedSeats = true; return Task.CompletedTask; }
    public Task<bool> HasUnsupportedRemainingShowtimesAsync(int id, string[] formats, DateTime now, CancellationToken ct) => Task.FromResult(false);
    public Task<IReadOnlyList<ShowtimeConflict>> FindOverlapsAsync(int? id, int auditoriumId, DateTime start, DateTime end, CancellationToken ct) => Task.FromResult(Overlaps);
    public void Add(Showtime showtime) => AddedShowtimes.Add(showtime);
    public Task SaveChangesAsync(CancellationToken ct) => Task.CompletedTask;
    public Task<IReadOnlyList<AdminMovie>> MoviesAsync(CancellationToken ct) => throw new NotSupportedException();
    public Task<IReadOnlyList<AdminAuditorium>> AuditoriumsAsync(CancellationToken ct) => throw new NotSupportedException();
    public Task<IReadOnlyList<AdminShowtime>> ShowtimesAsync(DateOnly date, CancellationToken ct) => throw new NotSupportedException();
    public Task<BookingPage> BookingsAsync(BookingFilters filters, CancellationToken ct) => throw new NotSupportedException();
    public Task<AdminBooking> BookingAsync(Guid id, CancellationToken ct) => throw new NotSupportedException();
    public void Add(Movie movie) => throw new NotSupportedException();
    public void Add(Auditorium auditorium) => throw new NotSupportedException();
    public void Add(Seat seat) => throw new NotSupportedException();
    public void Remove(Movie movie) => throw new NotSupportedException();
    public void Remove(Auditorium auditorium) => throw new NotSupportedException();
    public Task<bool> HasMovieShowtimesAsync(int id, CancellationToken ct) => throw new NotSupportedException();
    public Task<bool> HasAuditoriumShowtimesAsync(int id, CancellationToken ct) => throw new NotSupportedException();
    public Task<bool> HasRemainingAuditoriumShowtimesAsync(int id, DateTime now, CancellationToken ct) => throw new NotSupportedException();
    public Task<bool> HasShowtimeBookingsAsync(int id, CancellationToken ct) => throw new NotSupportedException();
}
