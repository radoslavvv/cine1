using Cinema.Api.Schedule.Repositories;
using Cinema.Api.Schedule.Services;

internal static class ServiceChecks
{
    public static async Task RunAsync(Action<bool, string> check)
    {
        var repository = new RecordingRepository();
        var service = new ScheduleService(repository);
        foreach (var date in new DateOnly?[] { null, new(1899, 12, 31), new(9999, 1, 1) })
            check((await service.GetForDateAsync(date, CancellationToken.None)).ValidationError is not null,
                $"Schedule service rejects invalid date {date}");
        check(repository.Calls == 0, "Invalid dates never reach the repository");

        using var cancellation = new CancellationTokenSource();
        var result = await service.GetForDateAsync(new DateOnly(2026, 10, 25), cancellation.Token);
        check(repository.Start == new DateTime(2026, 10, 24, 21, 0, 0, DateTimeKind.Utc)
            && repository.End == new DateTime(2026, 10, 25, 22, 0, 0, DateTimeKind.Utc),
            "Service queries the full 25-hour Kyiv autumn day");
        check(repository.Token == cancellation.Token, "Service forwards request cancellation");
        var screening = result.Showtimes.Single();
        check(result.ValidationError is null && screening.Id == 7 && screening.Movie.Id == 2
            && screening.Movie.Title == "Test film" && screening.Movie.DurationMinutes == 100
            && screening.Movie.Genres.SequenceEqual(["Drama"]) && screening.Movie.Synopsis == "Stored synopsis"
            && screening.Auditorium.Id == 3 && screening.Auditorium.Name == "Room 3"
            && screening.StartsAt == repository.Rows[0].StartsAt,
            "Service maps materialized query data into explicit movie/auditorium response DTOs");
        await service.GetForDateAsync(new DateOnly(2026, 3, 29), CancellationToken.None);
        check((repository.End - repository.Start).TotalHours == 23, "Service queries the 23-hour Kyiv spring day");

        repository.Rows = [];
        check((await service.GetForDateAsync(new DateOnly(2026, 1, 1), CancellationToken.None)).Showtimes.Count == 0,
            "Service preserves an empty schedule");
        cancellation.Cancel();
        try
        {
            await service.GetForDateAsync(new DateOnly(2026, 1, 1), cancellation.Token);
            throw new Exception("Cancellation should propagate");
        }
        catch (OperationCanceledException) { check(true, "Cancellation propagates from repository through service"); }
    }

    private sealed class RecordingRepository : IShowtimeRepository
    {
        public IReadOnlyList<ShowtimeReadModel> Rows { get; set; } =
            [new(7, new DateTime(2026, 10, 25, 11, 30, 0, DateTimeKind.Utc), 2, "Test film", 100, ["Drama"], "Stored synopsis", 3, "Room 3")];
        public int Calls { get; private set; }
        public DateTime Start { get; private set; }
        public DateTime End { get; private set; }
        public CancellationToken Token { get; private set; }

        public Task<IReadOnlyList<ShowtimeReadModel>> GetForIntervalAsync(DateTime startInclusive, DateTime endExclusive, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Calls++;
            (Start, End, Token) = (startInclusive, endExclusive, cancellationToken);
            return Task.FromResult(Rows);
        }
    }
}
