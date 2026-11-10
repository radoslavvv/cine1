using System.Text.Json;
using System.Text.RegularExpressions;
using CinemaR.Infrastructure.Data.Contexts;
using CinemaR.Infrastructure.Data.MigrationHistory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;

namespace CinemaR.LoadTests;

internal sealed class LoadTestRun
{
    private readonly DbContextOptions<CinemaRDbContext> options;

    public string ConnectionString { get; }
    public string OutputDirectory { get; }
    public JsonSerializerOptions JsonOptions { get; } = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public LoadTestRun(string outputDirectory)
    {
        ConnectionString = Environment.GetEnvironmentVariable("CINEMAR_LOAD_POSTGRES")
            ?? throw new InvalidOperationException("Use scripts/test-load.ps1; no application connection is accepted.");
        var settings = new NpgsqlConnectionStringBuilder(ConnectionString);
        if (!Regex.IsMatch(settings.Database ?? "", "^cinemar_load_[a-f0-9]{32}$")
            || settings.Host != "127.0.0.1")
        {
            throw new InvalidOperationException("Only a loopback cinemar_load_<random ID> database is allowed.");
        }

        options = new DbContextOptionsBuilder<CinemaRDbContext>()
            .UseNpgsql(ConnectionString, postgres => postgres.MigrationsHistoryTable("__ef_migrations_history", "cinemaR"))
            .ReplaceService<IHistoryRepository, CinemaRHistoryRepository>()
            .Options;
        OutputDirectory = Path.GetFullPath(outputDirectory);
        Directory.CreateDirectory(OutputDirectory);
    }

    public CinemaRDbContext OpenContext()
    {
        return new CinemaRDbContext(options);
    }
}
