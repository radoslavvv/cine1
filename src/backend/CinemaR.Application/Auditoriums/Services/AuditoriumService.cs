using CinemaR.Application.Admin.Exceptions;
using CinemaR.Application.Auditoriums.Responses;
using CinemaR.Application.Auditoriums.Commands;
using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Admin.Results;
using CinemaR.Application.Admin.Validation;

using CinemaR.Application.Auditoriums.Repositories;

namespace CinemaR.Application.Auditoriums.Services;

public sealed class AuditoriumService(IAuditoriumRepository repository, TimeProvider clock) : IAuditoriumService
{
    private DateTime Now => clock.GetUtcNow().UtcDateTime;
    public Task<IReadOnlyList<AdminAuditoriumResponse>> AuditoriumsAsync(CancellationToken ct) => repository.AuditoriumsAsync(ct);
    public Task<int> SaveAuditoriumAsync(int? id, SaveAuditoriumCommand command, CancellationToken ct)
    {
        var input = AdminValidation.Auditorium(command);
        return repository.ExecuteWriteAsync(async () =>
        {
            var room = id is null ? new Auditorium { Name = input.Name }
                : await repository.FindAuditoriumAsync(id.Value, ct) ?? throw Missing();
            if (id is not null)
            {
                if (await repository.HasUnsupportedRemainingShowtimesAsync(id.Value, input.SupportedFormats, Now, ct))
                    throw new AdminRuleException("A remaining screening uses a format you are removing.");
                if (input.ReplaceLayout)
                {
                    if (await repository.HasAuditoriumBookingsAsync(id.Value, ct))
                        throw new AdminRuleException("The seating layout is permanently locked after its first booking. Create a replacement auditorium.");
                    await repository.DeleteSeatsAsync(id.Value, ct);
                }
            }
            room.Name = input.Name;
            room.SupportedFormats = input.SupportedFormats;
            if (id is null) repository.Add(room);
            await repository.SaveChangesAsync(ct);
            if (id is null || input.ReplaceLayout)
                for (var row = 0; row < input.Rows; row++)
                    for (var column = 0; column < input.SeatsPerRow; column++)
                        repository.Add(new Seat
                        {
                            AuditoriumId = room.Id,
                            RowLabel = ((char)('A' + row)).ToString(),
                            Number = column + 1,
                            GridRow = row,
                            GridColumn = column
                        });
            return room.Id;
        }, ct);
    }

    public Task<int> RetireAuditoriumAsync(int id, CancellationToken ct) => repository.ExecuteWriteAsync(async () =>
    {
        var room = await repository.FindAuditoriumAsync(id, ct) ?? throw Missing();
        if (await repository.HasRemainingAuditoriumShowtimesAsync(id, Now, ct))
            throw new AdminRuleException("Finish or cancel this auditorium's remaining screenings before retiring it.");
        room.IsRetired = true;
        return id;
    }, ct);

    public Task<int> DeleteAuditoriumAsync(int id, CancellationToken ct) => repository.ExecuteWriteAsync(async () =>
    {
        var room = await repository.FindAuditoriumAsync(id, ct) ?? throw Missing();
        if (await repository.HasAuditoriumShowtimesAsync(id, ct))
            throw new AdminRuleException("This auditorium has screenings. Retire it to preserve history.");
        await repository.DeleteSeatsAsync(id, ct);
        repository.Remove(room);
        return id;
    }, ct);

    private static AdminRuleException Missing() => new("Record not found.", AdminFailure.NotFound);
}
