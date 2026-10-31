using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaR.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class CinemaRSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "cinemaR");

            migrationBuilder.RenameTable(
                name: "showtimes",
                schema: "catalog",
                newName: "showtimes",
                newSchema: "cinemaR");

            migrationBuilder.RenameTable(
                name: "seed_history",
                schema: "catalog",
                newName: "seed_history",
                newSchema: "cinemaR");

            migrationBuilder.RenameTable(
                name: "seats",
                schema: "catalog",
                newName: "seats",
                newSchema: "cinemaR");

            migrationBuilder.RenameTable(
                name: "movies",
                schema: "catalog",
                newName: "movies",
                newSchema: "cinemaR");

            migrationBuilder.RenameTable(
                name: "auditoriums",
                schema: "catalog",
                newName: "auditoriums",
                newSchema: "cinemaR");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "catalog");

            migrationBuilder.RenameTable(
                name: "showtimes",
                schema: "cinemaR",
                newName: "showtimes",
                newSchema: "catalog");

            migrationBuilder.RenameTable(
                name: "seed_history",
                schema: "cinemaR",
                newName: "seed_history",
                newSchema: "catalog");

            migrationBuilder.RenameTable(
                name: "seats",
                schema: "cinemaR",
                newName: "seats",
                newSchema: "catalog");

            migrationBuilder.RenameTable(
                name: "movies",
                schema: "cinemaR",
                newName: "movies",
                newSchema: "catalog");

            migrationBuilder.RenameTable(
                name: "auditoriums",
                schema: "cinemaR",
                newName: "auditoriums",
                newSchema: "catalog");
        }
    }
}
