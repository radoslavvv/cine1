using CinemaR.Application.SeatMaps.Repositories;
using CinemaR.Application.SeatMaps.ReadModels;

namespace CinemaR.Tests.Support;

internal sealed class TestSeatMapRepository(DateTime startsAt) : ISeatMapRepository
{
    public Task<SeatMapReadModel?> GetAsync(int id, CancellationToken ct)
    {
        return Task.FromResult<SeatMapReadModel?>(
        new(id, startsAt, 1, "Example", 100, ["Drama"], 1, "Room", [new SeatReadModel(1, "A", 1, 0, 0, true)]));
    }
}
