using Cinema.Application.Schedule.ReadModels;
using Cinema.Application.Schedule.Repositories;

namespace Cinema.Tests;

internal sealed class TestScheduleRepository : IShowtimeRepository
{
    public bool Called;
    public DateTime Start, End;
    public string? Genre, Format;
    public CancellationToken Token;
    public Task<IReadOnlyList<ShowtimeReadModel>> GetForIntervalAsync(DateTime start, DateTime end, string? genre, string format, CancellationToken ct)
    {
        Called = true;
        (Start, End, Genre, Format, Token) = (start, end, genre, format, ct);
        return Task.FromResult<IReadOnlyList<ShowtimeReadModel>>([new(1, start, 1, "Example", 100, ["Drama"], "Synopsis", 1, "Room", format)]);
    }
}
