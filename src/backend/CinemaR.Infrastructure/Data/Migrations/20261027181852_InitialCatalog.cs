using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CinemaR.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "catalog");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:btree_gist", ",,");

            migrationBuilder.CreateTable(
                name: "auditoriums",
                schema: "catalog",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auditoriums", x => x.id);
                    table.CheckConstraint("ck_auditorium_name", "length(btrim(name)) > 0");
                });

            migrationBuilder.CreateTable(
                name: "movies",
                schema: "catalog",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    title = table.Column<string>(type: "text", nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    genres = table.Column<string[]>(type: "text[]", nullable: false),
                    synopsis = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movies", x => x.id);
                    table.CheckConstraint("ck_movie_duration", "duration_minutes > 0 AND duration_minutes <= 1440");
                    table.CheckConstraint("ck_movie_genres", "cardinality(genres) > 0");
                    table.CheckConstraint("ck_movie_title", "length(btrim(title)) > 0");
                });

            migrationBuilder.CreateTable(
                name: "seed_history",
                schema: "catalog",
                columns: table => new
                {
                    name = table.Column<string>(type: "text", nullable: false),
                    applied_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_seed_history", x => x.name);
                });

            migrationBuilder.CreateTable(
                name: "showtimes",
                schema: "catalog",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    movie_id = table.Column<int>(type: "integer", nullable: false),
                    auditorium_id = table.Column<int>(type: "integer", nullable: false),
                    starts_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    occupied_until = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_showtimes", x => x.id);
                    table.CheckConstraint("ck_showtime_interval", "occupied_until > starts_at");
                    table.ForeignKey(
                        name: "FK_showtimes_auditoriums_auditorium_id",
                        column: x => x.auditorium_id,
                        principalSchema: "catalog",
                        principalTable: "auditoriums",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_showtimes_movies_movie_id",
                        column: x => x.movie_id,
                        principalSchema: "catalog",
                        principalTable: "movies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_auditoriums_name",
                schema: "catalog",
                table: "auditoriums",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_showtimes_auditorium_id",
                schema: "catalog",
                table: "showtimes",
                column: "auditorium_id");

            migrationBuilder.CreateIndex(
                name: "IX_showtimes_movie_id",
                schema: "catalog",
                table: "showtimes",
                column: "movie_id");

            migrationBuilder.CreateIndex(
                name: "IX_showtimes_starts_at",
                schema: "catalog",
                table: "showtimes",
                column: "starts_at");

            // EF does not model exclusion constraints. Preserve this SQL in future migrations.
            migrationBuilder.Sql("""
                ALTER TABLE catalog.showtimes
                ADD CONSTRAINT ex_showtimes_auditorium_occupied
                EXCLUDE USING gist (
                    auditorium_id WITH =,
                    tstzrange(starts_at, occupied_until, '[)') WITH &&
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "seed_history",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "showtimes",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "auditoriums",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "movies",
                schema: "catalog");
        }
    }
}
