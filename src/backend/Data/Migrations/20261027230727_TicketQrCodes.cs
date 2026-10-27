using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class TicketQrCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ticket_code",
                schema: "booking",
                table: "booked_seats",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            // Give previously confirmed seats independent codes before enforcing uniqueness.
            migrationBuilder.Sql("""
                UPDATE booking.booked_seats
                SET ticket_code = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
                WHERE ticket_code IS NULL;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "ticket_code",
                schema: "booking",
                table: "booked_seats",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_booked_seats_ticket_code",
                schema: "booking",
                table: "booked_seats",
                column: "ticket_code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_booked_seats_ticket_code",
                schema: "booking",
                table: "booked_seats");

            migrationBuilder.DropColumn(
                name: "ticket_code",
                schema: "booking",
                table: "booked_seats");
        }
    }
}
