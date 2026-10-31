using CinemaR.Application.Auditoriums.Contracts;
using CinemaR.Application.Auditoriums.Commands;

namespace CinemaR.Application.Auditoriums.Services;

public interface IAuditoriumService
{
    Task<IReadOnlyList<AdminAuditorium>> AuditoriumsAsync(CancellationToken ct);
    Task<int> SaveAuditoriumAsync(int? id, SaveAuditoriumCommand command, CancellationToken ct);
    Task<int> RetireAuditoriumAsync(int id, CancellationToken ct);
    Task<int> DeleteAuditoriumAsync(int id, CancellationToken ct);
}
