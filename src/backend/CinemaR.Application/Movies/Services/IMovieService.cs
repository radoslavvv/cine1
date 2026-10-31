using CinemaR.Application.Movies.Responses;
using CinemaR.Application.Movies.Commands;

namespace CinemaR.Application.Movies.Services;

public interface IMovieService
{
    Task<IReadOnlyList<AdminMovieResponse>> MoviesAsync(CancellationToken ct);
    Task<int> SaveMovieAsync(int? id, SaveMovieCommand command, CancellationToken ct);
    Task<int> ArchiveMovieAsync(int id, CancellationToken ct);
    Task<int> DeleteMovieAsync(int id, CancellationToken ct);
}
