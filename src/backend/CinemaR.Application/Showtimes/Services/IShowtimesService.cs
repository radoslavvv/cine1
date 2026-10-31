using CinemaR.Application.Showtimes.Results;
using CinemaR.Application.Showtimes.Contracts;

namespace CinemaR.Application.Showtimes.Services;

public interface IShowtimesService
{
    Task<ShowtimesResult> GetForDateAsync(GetShowtimesQuery query, CancellationToken cancellationToken);
}
