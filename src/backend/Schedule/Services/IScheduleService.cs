using Cinema.Api.Schedule.Contracts;

namespace Cinema.Api.Schedule.Services;

public interface IScheduleService
{
    Task<ScheduleResult> GetForDateAsync(DateOnly? date, string? genre, string? format, CancellationToken cancellationToken);
}
