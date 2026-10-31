using CinemaR.Infrastructure.Data.Contexts;
using CinemaR.Infrastructure.Data.MigrationHistory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;

namespace CinemaR.IntegrationTests.Support;

// Every test owns a newly created database. Never reset or seed a developer database.
internal sealed class PostgresDatabase : IAsyncDisposable
{
    private readonly string name = "cinemar_test_" + Guid.NewGuid().ToString("N");
    private readonly string adminConnection;
    private readonly string connection;

    public string ConnectionString
    {
        get
        {
            return connection;
        }
    }

    private PostgresDatabase(string server)
    {
        var settings = new NpgsqlConnectionStringBuilder(server)
        {
            Database = "postgres",
            Pooling = false,
            Timeout = 10,
            CommandTimeout = 30
        };

        adminConnection = settings.ConnectionString;
        settings.Database = name;
        connection = settings.ConnectionString;
    }

    public static async Task<PostgresDatabase> CreateAsync(bool migrate = true)
    {
        var server = Environment.GetEnvironmentVariable("CINEMAR_TEST_POSTGRES")
            ?? throw new InvalidOperationException("Run scripts/test-postgres.ps1 or set CINEMAR_TEST_POSTGRES to a disposable PostgreSQL 18 server. Integration tests never use the application connection string.");
        var database = new PostgresDatabase(server);

        await using var admin = new NpgsqlConnection(database.adminConnection);
        await admin.OpenAsync();
        await using var create = new NpgsqlCommand($"CREATE DATABASE {database.name}", admin);
        await create.ExecuteNonQueryAsync();

        try
        {
            if (migrate)
            {
                await using var db = database.OpenContext();
                await db.Database.MigrateAsync();
            }

            return database;
        }
        catch
        {
            await database.DisposeAsync();
            throw;
        }
    }

    public CinemaRDbContext OpenContext(bool legacyHistory = false)
    {
        var options = new DbContextOptionsBuilder<CinemaRDbContext>()
            .UseNpgsql(connection, postgres => postgres.MigrationsHistoryTable(
                "__ef_migrations_history", legacyHistory ? "catalog" : "cinemaR"));

        if (!legacyHistory)
        {
            options.ReplaceService<IHistoryRepository, CinemaRHistoryRepository>();
        }

        return new CinemaRDbContext(options.Options);
    }

    public async ValueTask DisposeAsync()
    {
        // The identifier is generated here, never supplied by an environment variable.
        await using var admin = new NpgsqlConnection(adminConnection);
        await admin.OpenAsync();
        await using var drop = new NpgsqlCommand($"DROP DATABASE IF EXISTS {name} WITH (FORCE)", admin);
        await drop.ExecuteNonQueryAsync();
    }
}
