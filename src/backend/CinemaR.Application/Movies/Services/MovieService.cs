using CinemaR.Application.Admin.Exceptions;
using CinemaR.Application.Movies.Responses;
using CinemaR.Application.Movies.Commands;
using CinemaR.Application.Admin.Results;
using CinemaR.Application.Admin.Validation;
using CinemaR.Domain.Movies;

using CinemaR.Application.Movies.Repositories;

namespace CinemaR.Application.Movies.Services;

public sealed class MovieService(IMovieRepository repository, TimeProvider clock) : IMovieService
{
    private DateTime Now
    {
        get
        {
            return clock.GetUtcNow().UtcDateTime;
        }
    }

    public Task<IReadOnlyList<AdminMovieResponse>> MoviesAsync(CancellationToken ct)
    {
        return repository.MoviesAsync(ct);
    }

    public Task<int> SaveMovieAsync(int? id, SaveMovieCommand command, CancellationToken ct)
    {
        var input = AdminValidation.Movie(command);

        return repository.ExecuteWriteAsync(async () =>
        {
            var movie = id is null ? new Movie { Title = input.Title, Genres = [], Synopsis = "" }
                : await repository.FindMovieAsync(id.Value, ct) ?? throw Missing();

            movie.Title = input.Title;
            movie.DurationMinutes = input.DurationMinutes;
            movie.Genres = input.Genres;
            movie.Synopsis = input.Synopsis;
            movie.PosterUrl = input.PosterUrl;
            movie.BackdropUrl = input.BackdropUrl;

            if (id is null)
            {
                repository.Add(movie);
            }

            await repository.SaveChangesAsync(ct);

            return movie.Id;
        }, ct);
    }

    public Task<int> ArchiveMovieAsync(int id, CancellationToken ct)
    {
        return repository.ExecuteWriteAsync(async () =>
    {
        var movie = await repository.FindMovieAsync(id, ct) ?? throw Missing();

        if (await repository.HasRemainingMovieShowtimesAsync(id, Now, ct))
        {
            throw new AdminRuleException("Finish or cancel this movie's remaining screenings before archiving it.");
        }

        movie.IsArchived = true;

        return id;
    }, ct);
    }

    public Task<int> DeleteMovieAsync(int id, CancellationToken ct)
    {
        return repository.ExecuteWriteAsync(async () =>
    {
        var movie = await repository.FindMovieAsync(id, ct) ?? throw Missing();

        if (await repository.HasMovieShowtimesAsync(id, ct))
        {
            throw new AdminRuleException("This movie has screenings. Archive it to preserve history.");
        }

        repository.Remove(movie);

        return id;
    }, ct);
    }

    private static AdminRuleException Missing()
    {
        return new("Record not found.", AdminFailure.NotFound);
    }
}
