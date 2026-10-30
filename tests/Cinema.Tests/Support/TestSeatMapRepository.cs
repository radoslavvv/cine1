using Cinema.Application.Booking.ReadModels;
using Cinema.Application.Booking.Repositories;

namespace Cinema.Tests;

internal sealed class TestSeatMapRepository(DateTime startsAt) : ISeatMapRepository
{
    public Task<SeatMapReadModel?> GetAsync(int id, CancellationToken ct) => Task.FromResult<SeatMapReadModel?>(
        new(id, startsAt, 1, "Example", 100, ["Drama"], 1, "Room", [new SeatReadModel(1, "A", 1, 0, 0, true)]));
}
