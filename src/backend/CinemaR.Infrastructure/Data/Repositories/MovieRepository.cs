using CinemaR.Application.Movies.Contracts;
using CinemaR.Application.Admin.Results;
using CinemaR.Domain.Movies;
using Microsoft.EntityFrameworkCore;
using Npgsql;

using CinemaR.Application.Movies.Repositories;
namespace CinemaR.Infrastructure.Data.Repositories;

public sealed class MovieRepository(CinemaRDbContext db) : CinemaWriteRepository(db), IMovieRepository
{
    public async Task<IReadOnlyList<AdminMovie>> MoviesAsync(CancellationToken ct)
    {
        var movies = await Db.Movies.AsNoTracking().OrderBy(m => m.Title).Select(m => new AdminMovie(
            m.Id, m.Title, m.DurationMinutes, m.Genres, m.Synopsis, m.PosterUrl, m.BackdropUrl, m.IsArchived,
            Db.Showtimes.Any(s => s.MovieId == m.Id))).ToListAsync(ct);
        return movies;
    }

    public Task<Movie?> FindMovieAsync(int id, CancellationToken ct) => Db.Movies.SingleOrDefaultAsync(m => m.Id == id, ct);

    public void Add(Movie movie) => Db.Movies.Add(movie);

    public void Remove(Movie movie) => Db.Movies.Remove(movie);

    public Task<bool> HasMovieShowtimesAsync(int id, CancellationToken ct) => Db.Showtimes.AnyAsync(s => s.MovieId == id, ct);

    public Task<bool> HasRemainingMovieShowtimesAsync(int id, DateTime now, CancellationToken ct) =>
        Db.Showtimes.AnyAsync(s => s.MovieId == id && s.CancelledAt == null && s.OccupiedUntil > now, ct);

}
