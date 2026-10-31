using CinemaR.Infrastructure.Data.Repositories;
using CinemaR.IntegrationTests.Support;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using Xunit;

namespace CinemaR.IntegrationTests;

public sealed class MigrationExecutionTests
{
    private const string LegacyMigration = "20261031002743_CustomerIdentity";

    [Fact]
    public async Task Idempotent_script_initializes_an_empty_database_and_can_be_applied_twice()
    {
        await using var database = await PostgresDatabase.CreateAsync(migrate: false);
        await using (var db = database.OpenContext())
        {
            var script = db.GetService<IMigrator>().GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent);
            await db.Database.ExecuteSqlRawAsync(script);
            await db.Database.ExecuteSqlRawAsync(script);
            Assert.Equal(8, (await db.Database.GetAppliedMigrationsAsync()).Count());
            Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        }

        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var booking = await cinema.BookAsync([cinema.SeatIds[0]]);
        Assert.NotNull(booking.Confirmation);
        Assert.NotNull(await cinema.FindAsync(booking.Confirmation!.ConfirmationToken));
    }

    [Fact]
    public async Task Legacy_history_and_existing_tickets_survive_upgrade_rollback_and_reapply()
    {
        await using var database = await PostgresDatabase.CreateAsync(migrate: false);
        await using (var legacy = database.OpenContext(legacyHistory: true))
        {
            await legacy.GetService<IMigrator>().MigrateAsync(LegacyMigration);
            await legacy.Database.ExecuteSqlRawAsync("""
                INSERT INTO catalog.movies (id, title, duration_minutes, genres, synopsis, is_archived)
                VALUES (41, 'Legacy film', 100, ARRAY['Drama'], 'Preserve me', false);
                INSERT INTO catalog.auditoriums (id, name, supported_formats, is_retired)
                VALUES (41, 'Legacy room', ARRAY['2D'], false);
                INSERT INTO catalog.seats (id, auditorium_id, row_label, number, grid_row, grid_column)
                VALUES (41, 41, 'B', 7, 1, 6);
                INSERT INTO catalog.showtimes (id, movie_id, auditorium_id, starts_at, occupied_until, format)
                VALUES (41, 41, 41, '2026-11-02T12:00:00Z', '2026-11-02T13:55:00Z', '2D');
                INSERT INTO catalog.seed_history (name, applied_at) VALUES ('preserved-marker', '2026-10-31T12:00:00Z');
                INSERT INTO booking.bookings (id, confirmation_token, email, showtime_id, confirmed_at)
                VALUES ('11111111-1111-1111-1111-111111111111', repeat('a', 64), 'legacy@example.test', 41, '2026-11-01T12:00:00Z');
                INSERT INTO booking.booked_seats (showtime_id, seat_id, booking_id, ticket_code)
                VALUES (41, 41, '11111111-1111-1111-1111-111111111111', repeat('b', 64));
                """);
        }

        await using (var upgraded = database.OpenContext())
        {
            await upgraded.Database.MigrateAsync();
            await AssertLegacyBookingAsync(upgraded);
            Assert.Equal("preserved-marker", (await upgraded.SeedHistory.SingleAsync()).Name);
            Assert.Equal(8, (await upgraded.Database.GetAppliedMigrationsAsync()).Count());
            Assert.False(await upgraded.Database.SqlQueryRaw<bool>(
                "SELECT to_regclass('catalog.__ef_migrations_history') IS NOT NULL AS \"Value\"").SingleAsync());
            await upgraded.GetService<IMigrator>().MigrateAsync(LegacyMigration);
        }

        await using var reapplied = database.OpenContext();
        await reapplied.Database.MigrateAsync();
        await AssertLegacyBookingAsync(reapplied);
        Assert.Equal(8, (await reapplied.Database.GetAppliedMigrationsAsync()).Count());
    }

    [Fact]
    public async Task Ambiguous_dual_histories_fail_before_modifying_the_existing_schema()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        await using var db = database.OpenContext();
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE catalog.__ef_migrations_history
            ("MigrationId" varchar(150) NOT NULL PRIMARY KEY, "ProductVersion" varchar(32) NOT NULL);
            """);

        var error = await Assert.ThrowsAsync<PostgresException>(() => db.Database.MigrateAsync());

        Assert.Contains("Both legacy and cinemaR migration histories exist", error.MessageText);
        Assert.Equal(4, (await cinema.SeatsAsync())!.Seats.Count);
    }

    private static async Task AssertLegacyBookingAsync(CinemaR.Infrastructure.Data.Contexts.CinemaRDbContext db)
    {
        var booking = await new BookingRepository(db, new TestClock()).FindAsync(new string('a', 64), CancellationToken.None);
        Assert.NotNull(booking);
        Assert.Equal("Legacy film", booking!.MovieTitle);
        Assert.Equal("Legacy room", booking.AuditoriumName);
        Assert.Equal("legacy@example.test", booking.Email);
        var ticket = Assert.Single(booking.Tickets);
        Assert.Equal("B", ticket.RowLabel);
        Assert.Equal(7, ticket.Number);
        Assert.Equal(new string('b', 64), ticket.TicketCode);
    }
}
