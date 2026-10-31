using CinemaR.Application.Showtimes.Responses;
using CinemaR.Application.Showtimes.Commands;

namespace CinemaR.Application.Showtimes.Services;

public interface IShowtimeManagementService
{
    Task<IReadOnlyList<AdminShowtimeResponse>> ShowtimesAsync(string date, CancellationToken ct);
    Task<int[]> SaveShowtimesAsync(int? id, SaveShowtimesCommand input, CancellationToken ct);
    Task<int> CancelShowtimeAsync(int id, CancellationToken ct);
}
