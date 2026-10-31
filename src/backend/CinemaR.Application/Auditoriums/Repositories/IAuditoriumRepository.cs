using CinemaR.Application.Auditoriums.Responses;
using CinemaR.Domain.Auditoriums;

namespace CinemaR.Application.Auditoriums.Repositories;

public interface IAuditoriumRepository : CinemaR.Application.Persistence.IWriteTransaction
{
    Task<IReadOnlyList<AdminAuditoriumResponse>> AuditoriumsAsync(CancellationToken ct);
    Task<Auditorium?> FindAuditoriumAsync(int id, CancellationToken ct);
    void Add(Auditorium auditorium);
    void Add(Seat seat);
    void Remove(Auditorium auditorium);
    Task DeleteSeatsAsync(int id, CancellationToken ct);
    Task<bool> HasAuditoriumShowtimesAsync(int id, CancellationToken ct);
    Task<bool> HasRemainingAuditoriumShowtimesAsync(int id, DateTime now, CancellationToken ct);
    Task<bool> HasUnsupportedRemainingShowtimesAsync(int id, string[] formats, DateTime now, CancellationToken ct);
    Task<bool> HasAuditoriumBookingsAsync(int id, CancellationToken ct);
}
