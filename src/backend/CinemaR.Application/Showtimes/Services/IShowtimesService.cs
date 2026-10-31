using CinemaR.Application.Showtimes.Queries;
using CinemaR.Application.Showtimes.Results;
using CinemaR.Application.Showtimes.Responses;

namespace CinemaR.Application.Showtimes.Services;

public interface IShowtimesService
{
    Task<ShowtimesResult> GetForDateAsync(GetShowtimesQuery query, CancellationToken cancellationToken);
}
