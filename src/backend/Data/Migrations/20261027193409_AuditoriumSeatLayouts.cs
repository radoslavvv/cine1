using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Cinema.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AuditoriumSeatLayouts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "seats",
                schema: "catalog",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    auditorium_id = table.Column<int>(type: "integer", nullable: false),
                    row_label = table.Column<string>(type: "text", nullable: false),
                    number = table.Column<int>(type: "integer", nullable: false),
                    grid_row = table.Column<int>(type: "integer", nullable: false),
                    grid_column = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_seats", x => x.id);
                    table.CheckConstraint("ck_seat_label", "length(btrim(row_label)) > 0 AND number > 0");
                    table.CheckConstraint("ck_seat_position", "grid_row >= 0 AND grid_column >= 0");
                    table.ForeignKey(
                        name: "FK_seats_auditoriums_auditorium_id",
                        column: x => x.auditorium_id,
                        principalSchema: "catalog",
                        principalTable: "auditoriums",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_seats_auditorium_id_grid_row_grid_column",
                schema: "catalog",
                table: "seats",
                columns: new[] { "auditorium_id", "grid_row", "grid_column" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_seats_auditorium_id_row_label_number",
                schema: "catalog",
                table: "seats",
                columns: new[] { "auditorium_id", "row_label", "number" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "seats",
                schema: "catalog");
        }
    }
}
