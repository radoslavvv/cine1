using Cinema.Api.Movies;
using Cinema.Api.Schedule;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Data;

public sealed class CatalogDbContext(DbContextOptions<CatalogDbContext> options) : DbContext(options)
{
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Auditorium> Auditoriums => Set<Auditorium>();
    public DbSet<Showtime> Showtimes => Set<Showtime>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<SeedHistory> SeedHistory => Set<SeedHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("catalog");
        modelBuilder.HasPostgresExtension("btree_gist");
        modelBuilder.Entity<Movie>(entity =>
        {
            entity.ToTable("movies", table =>
            {
                table.HasCheckConstraint("ck_movie_title", "length(btrim(title)) > 0");
                table.HasCheckConstraint("ck_movie_duration", "duration_minutes > 0 AND duration_minutes <= 1440");
                table.HasCheckConstraint("ck_movie_genres", "cardinality(genres) > 0");
            });
            entity.HasKey(movie => movie.Id);
            entity.Property(movie => movie.Title).IsRequired();
            entity.Property(movie => movie.Genres).IsRequired();
            entity.Property(movie => movie.Synopsis).IsRequired();
        });
        modelBuilder.Entity<Auditorium>(entity =>
        {
            entity.ToTable("auditoriums", table => table.HasCheckConstraint("ck_auditorium_name", "length(btrim(name)) > 0"));
            entity.HasKey(auditorium => auditorium.Id);
            entity.Property(auditorium => auditorium.Name).IsRequired();
            entity.HasIndex(auditorium => auditorium.Name).IsUnique();
        });
        modelBuilder.Entity<Showtime>(entity =>
        {
            entity.ToTable("showtimes", table => table.HasCheckConstraint("ck_showtime_interval", "occupied_until > starts_at"));
            entity.HasKey(showtime => showtime.Id);
            entity.HasOne(showtime => showtime.Movie).WithMany().HasForeignKey(showtime => showtime.MovieId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(showtime => showtime.Auditorium).WithMany().HasForeignKey(showtime => showtime.AuditoriumId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(showtime => showtime.StartsAt);
        });
        modelBuilder.Entity<Seat>(entity =>
        {
            entity.ToTable("seats", table =>
            {
                table.HasCheckConstraint("ck_seat_position", "grid_row >= 0 AND grid_column >= 0");
                table.HasCheckConstraint("ck_seat_label", "length(btrim(row_label)) > 0 AND number > 0");
            });
            entity.HasKey(seat => seat.Id);
            entity.HasOne(seat => seat.Auditorium).WithMany().HasForeignKey(seat => seat.AuditoriumId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(seat => new { seat.AuditoriumId, seat.GridRow, seat.GridColumn }).IsUnique();
            entity.HasIndex(seat => new { seat.AuditoriumId, seat.RowLabel, seat.Number }).IsUnique();
        });
        modelBuilder.Entity<SeedHistory>(entity =>
        {
            entity.ToTable("seed_history");
            entity.HasKey(seed => seed.Name);
        });

        // Keep PostgreSQL identifiers readable without quoted PascalCase names.
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        foreach (var property in entity.GetProperties())
            property.SetColumnName(string.Concat(property.Name.Select((character, index) =>
                char.IsUpper(character) && index > 0 ? "_" + char.ToLowerInvariant(character) : char.ToLowerInvariant(character).ToString())));
    }
}

public sealed class SeedHistory
{
    public required string Name { get; set; }
    public DateTime AppliedAt { get; set; }
}
