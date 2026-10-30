using Cinema.Application.Schedule.Results;
using Cinema.Application.Schedule.Contracts;

namespace Cinema.Application.Schedule.Services;

public interface IScheduleService
{
    Task<ScheduleResult> GetForDateAsync(GetScheduleQuery query, CancellationToken cancellationToken);
}
