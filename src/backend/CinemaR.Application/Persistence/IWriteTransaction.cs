namespace CinemaR.Application.Persistence;

public interface IWriteTransaction
{
    Task<T> ExecuteWriteAsync<T>(Func<Task<T>> action, CancellationToken ct);

    Task SaveChangesAsync(CancellationToken ct);
}
