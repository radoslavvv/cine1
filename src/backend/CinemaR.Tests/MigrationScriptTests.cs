using CinemaR.Infrastructure.Data.MigrationHistory;
using CinemaR.Infrastructure.Data.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Xunit;

namespace CinemaR.Tests;

public sealed class MigrationScriptTests
{
    [Fact]
    public void Idempotent_script_relocates_legacy_history_before_reading_it_and_moves_tables_without_drops()
    {
        using var db = new CinemaRDbContext(new DbContextOptionsBuilder<CinemaRDbContext>()
            .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused",
                postgres => postgres.MigrationsHistoryTable("__ef_migrations_history", "cinemaR"))
            .ReplaceService<IHistoryRepository, CinemaRHistoryRepository>().Options);
        var script = db.GetService<IMigrator>().GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent);
        var relocation = script.IndexOf("ALTER TABLE catalog.__ef_migrations_history SET SCHEMA \"cinemaR\"", StringComparison.Ordinal);
        var historyRead = script.IndexOf("SELECT 1 FROM \"cinemaR\".__ef_migrations_history", StringComparison.Ordinal);
        Assert.True(relocation >= 0 && historyRead > relocation);
        Assert.Contains("Both legacy and cinemaR migration histories exist", script);
        foreach (var table in new[] { "movies", "auditoriums", "seats", "showtimes", "seed_history" })
            Assert.Contains($"ALTER TABLE catalog.{table} SET SCHEMA \"cinemaR\"", script);
        Assert.DoesNotContain("DROP TABLE", script);
        Assert.Equal("cinemaR", db.Model.GetDefaultSchema());
    }
}
