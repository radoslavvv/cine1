using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ShowtimeFormats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "format",
                schema: "catalog",
                table: "showtimes",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "2D");

            migrationBuilder.AddCheckConstraint(
                name: "ck_showtime_format",
                schema: "catalog",
                table: "showtimes",
                sql: "format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_showtime_format",
                schema: "catalog",
                table: "showtimes");

            migrationBuilder.DropColumn(
                name: "format",
                schema: "catalog",
                table: "showtimes");
        }
    }
}
