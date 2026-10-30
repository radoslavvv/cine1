using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cinema.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConfirmedBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "booking");

            migrationBuilder.CreateTable(
                name: "bookings",
                schema: "booking",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    confirmation_token = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    showtime_id = table.Column<int>(type: "integer", nullable: false),
                    confirmed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bookings", x => x.id);
                    table.UniqueConstraint("AK_bookings_id_showtime_id", x => new { x.id, x.showtime_id });
                    table.ForeignKey(
                        name: "FK_bookings_showtimes_showtime_id",
                        column: x => x.showtime_id,
                        principalSchema: "catalog",
                        principalTable: "showtimes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "booked_seats",
                schema: "booking",
                columns: table => new
                {
                    showtime_id = table.Column<int>(type: "integer", nullable: false),
                    seat_id = table.Column<int>(type: "integer", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_booked_seats", x => new { x.showtime_id, x.seat_id });
                    table.ForeignKey(
                        name: "FK_booked_seats_bookings_booking_id_showtime_id",
                        columns: x => new { x.booking_id, x.showtime_id },
                        principalSchema: "booking",
                        principalTable: "bookings",
                        principalColumns: new[] { "id", "showtime_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_booked_seats_seats_seat_id",
                        column: x => x.seat_id,
                        principalSchema: "catalog",
                        principalTable: "seats",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_booked_seats_booking_id_showtime_id",
                schema: "booking",
                table: "booked_seats",
                columns: new[] { "booking_id", "showtime_id" });

            migrationBuilder.CreateIndex(
                name: "IX_booked_seats_seat_id",
                schema: "booking",
                table: "booked_seats",
                column: "seat_id");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_confirmation_token",
                schema: "booking",
                table: "bookings",
                column: "confirmation_token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bookings_showtime_id",
                schema: "booking",
                table: "bookings",
                column: "showtime_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "booked_seats",
                schema: "booking");

            migrationBuilder.DropTable(
                name: "bookings",
                schema: "booking");
        }
    }
}
