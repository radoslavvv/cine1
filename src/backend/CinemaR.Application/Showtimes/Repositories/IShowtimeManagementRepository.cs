using CinemaR.Application.Showtimes.Contracts;
using CinemaR.Application.Showtimes.ReadModels;
using CinemaR.Domain.Auditoriums;
using CinemaR.Domain.Movies;
using CinemaR.Domain.Showtimes;

namespace CinemaR.Application.Showtimes.Repositories;

public interface IShowtimeManagementRepository : CinemaR.Application.Persistence.IWriteTransaction
{
    Task<IReadOnlyList<AdminShowtime>> ShowtimesAsync(DateOnly date, CancellationToken ct);
    Task<Movie?> FindMovieAsync(int id, CancellationToken ct);
    Task<Auditorium?> FindAuditoriumAsync(int id, CancellationToken ct);
    Task<Showtime?> FindShowtimeAsync(int id, CancellationToken ct);
    void Add(Showtime showtime);
    Task<bool> HasShowtimeBookingsAsync(int id, CancellationToken ct);
    Task<IReadOnlyList<ShowtimeConflict>> FindOverlapsAsync(int? exceptId, int auditoriumId, DateTime start, DateTime end, CancellationToken ct);
}
