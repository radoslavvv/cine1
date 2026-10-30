using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Administration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "cancelled_at",
                schema: "catalog",
                table: "showtimes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "backdrop_url",
                schema: "catalog",
                table: "movies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_archived",
                schema: "catalog",
                table: "movies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "poster_url",
                schema: "catalog",
                table: "movies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_retired",
                schema: "catalog",
                table: "auditoriums",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string[]>(
                name: "supported_formats",
                schema: "catalog",
                table: "auditoriums",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.AddColumn<int>(
                name: "scheduled_duration_minutes",
                schema: "catalog",
                table: "showtimes",
                type: "integer",
                nullable: false,
                computedColumnSql: "(EXTRACT(EPOCH FROM (occupied_until - starts_at)) / 60)::integer - 15",
                stored: true);

            // Existing rooms accepted all four formats before capabilities were explicit.
            migrationBuilder.Sql("UPDATE catalog.auditoriums SET supported_formats = ARRAY['2D', '3D', 'IMAX 2D', 'IMAX 3D']");
            // Cancelled screenings remain historical records but no longer occupy the room.
            migrationBuilder.Sql("""
                ALTER TABLE catalog.showtimes DROP CONSTRAINT ex_showtimes_auditorium_occupied;
                ALTER TABLE catalog.showtimes ADD CONSTRAINT ex_showtimes_auditorium_occupied
                EXCLUDE USING gist (auditorium_id WITH =, tstzrange(starts_at, occupied_until, '[)') WITH &&)
                WHERE (cancelled_at IS NULL);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE catalog.showtimes DROP CONSTRAINT ex_showtimes_auditorium_occupied;
                ALTER TABLE catalog.showtimes ADD CONSTRAINT ex_showtimes_auditorium_occupied
                EXCLUDE USING gist (auditorium_id WITH =, tstzrange(starts_at, occupied_until, '[)') WITH &&);
                """);
            migrationBuilder.DropColumn(
                name: "scheduled_duration_minutes",
                schema: "catalog",
                table: "showtimes");

            migrationBuilder.DropColumn(
                name: "cancelled_at",
                schema: "catalog",
                table: "showtimes");

            migrationBuilder.DropColumn(
                name: "backdrop_url",
                schema: "catalog",
                table: "movies");

            migrationBuilder.DropColumn(
                name: "is_archived",
                schema: "catalog",
                table: "movies");

            migrationBuilder.DropColumn(
                name: "poster_url",
                schema: "catalog",
                table: "movies");

            migrationBuilder.DropColumn(
                name: "is_retired",
                schema: "catalog",
                table: "auditoriums");

            migrationBuilder.DropColumn(
                name: "supported_formats",
                schema: "catalog",
                table: "auditoriums");
        }
    }
}
