using CinemaR.Application.Admin.Results;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CinemaR.Infrastructure.Data.Repositories;

public abstract class CinemaWriteRepository(CinemaRDbContext db) : CinemaR.Application.Persistence.IWriteTransaction
{
    protected CinemaRDbContext Db { get; } = db;
    public Task SaveChangesAsync(CancellationToken ct) => Db.SaveChangesAsync(ct);

    public async Task<T> ExecuteWriteAsync<T>(Func<Task<T>> action, CancellationToken ct)
    {
        await using var transaction = await Db.Database.BeginTransactionAsync(ct);
        await CinemaRWriteLock.ExclusiveAsync(Db, ct);
        try
        {
            var result = await action();
            await Db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return result;
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException)
        {
            var postgres = (PostgresException)exception.InnerException;
            var message = postgres.SqlState switch
            {
                PostgresErrorCodes.ExclusionViolation => "A screening conflicts with this auditorium's showtimes. Nothing was saved; refresh and adjust the dates.",
                PostgresErrorCodes.UniqueViolation => "This name or seat layout already exists. Nothing was saved.",
                PostgresErrorCodes.ForeignKeyViolation => "This record is in use and cannot be deleted.",
                _ => null
            };
            if (message is null) throw;
            throw new AdminRuleException(message);
        }
    }
}
