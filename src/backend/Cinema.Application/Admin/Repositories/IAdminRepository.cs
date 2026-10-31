using Cinema.Application.Admin.Contracts;
using Cinema.Application.Admin.ReadModels;
using Cinema.Domain.Movies;
using Cinema.Domain.Schedule;

namespace Cinema.Application.Admin.Repositories;

// Entities returned for writes are tracked within ExecuteWriteAsync. Query results are materialized.
public interface IAdminRepository
{
    Task<AdminCatalog> CatalogAsync(CancellationToken ct);
    Task<IReadOnlyList<AdminShowtime>> ShowtimesAsync(DateOnly date, CancellationToken ct);
    Task<BookingPage> BookingsAsync(BookingFilters filters, CancellationToken ct);
    Task<AdminBooking> BookingAsync(Guid id, CancellationToken ct);
    Task<Movie?> FindMovieAsync(int id, CancellationToken ct);
    Task<Auditorium?> FindAuditoriumAsync(int id, CancellationToken ct);
    Task<Showtime?> FindShowtimeAsync(int id, CancellationToken ct);
    void Add(Movie movie);
    void Add(Auditorium auditorium);
    void Add(Seat seat);
    void Add(Showtime showtime);
    void Remove(Movie movie);
    void Remove(Auditorium auditorium);
    Task SaveChangesAsync(CancellationToken ct);
    Task DeleteSeatsAsync(int id, CancellationToken ct);
    Task<bool> HasMovieShowtimesAsync(int id, CancellationToken ct);
    Task<bool> HasAuditoriumShowtimesAsync(int id, CancellationToken ct);
    Task<bool> HasRemainingMovieShowtimesAsync(int id, DateTime now, CancellationToken ct);
    Task<bool> HasRemainingAuditoriumShowtimesAsync(int id, DateTime now, CancellationToken ct);
    Task<bool> HasUnsupportedRemainingShowtimesAsync(int id, string[] formats, DateTime now, CancellationToken ct);
    Task<bool> HasAuditoriumBookingsAsync(int id, CancellationToken ct);
    Task<bool> HasShowtimeBookingsAsync(int id, CancellationToken ct);
    Task<IReadOnlyList<ShowtimeConflict>> FindOverlapsAsync(int? exceptId, int auditoriumId, DateTime start, DateTime end, CancellationToken ct);
    Task<T> ExecuteWriteAsync<T>(Func<Task<T>> action, CancellationToken ct);
}
