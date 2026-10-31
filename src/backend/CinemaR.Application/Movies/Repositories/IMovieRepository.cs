using CinemaR.Application.Movies.Responses;
using CinemaR.Domain.Movies;

namespace CinemaR.Application.Movies.Repositories;

public interface IMovieRepository : CinemaR.Application.Persistence.IWriteTransaction
{
    Task<IReadOnlyList<AdminMovieResponse>> MoviesAsync(CancellationToken ct);

    Task<Movie?> FindMovieAsync(int id, CancellationToken ct);

    void Add(Movie movie);

    void Remove(Movie movie);

    Task<bool> HasMovieShowtimesAsync(int id, CancellationToken ct);

    Task<bool> HasRemainingMovieShowtimesAsync(int id, DateTime now, CancellationToken ct);
}
