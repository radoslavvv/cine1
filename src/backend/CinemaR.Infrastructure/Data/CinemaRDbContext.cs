using CinemaR.Domain.Auditoriums;
using CinemaR.Infrastructure.Identity.Entities;
using CinemaR.Domain.Movies;
using CinemaR.Domain.Booking;
using CinemaR.Domain.Showtimes;
using Microsoft.EntityFrameworkCore;
using CinemaR.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace CinemaR.Infrastructure.Data;

public sealed class CinemaRDbContext(DbContextOptions<CinemaRDbContext> options) : IdentityUserContext<CinemaRUser>(options)
{
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Auditorium> Auditoriums => Set<Auditorium>();
    public DbSet<Showtime> Showtimes => Set<Showtime>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<ConfirmedBooking> Bookings => Set<ConfirmedBooking>();
    public DbSet<BookedSeat> BookedSeats => Set<BookedSeat>();
    public DbSet<SeedHistory> SeedHistory => Set<SeedHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<CinemaRUser>(entity =>
        {
            entity.ToTable("users", "identity");
            entity.HasIndex(user => user.NormalizedEmail).IsUnique();
            entity.HasIndex(user => user.IsAdministrator).IsUnique().HasFilter("is_administrator = true");
        });
        modelBuilder.Entity<IdentityUserClaim<string>>().ToTable("user_claims", "identity");
        modelBuilder.Entity<IdentityUserLogin<string>>().ToTable("user_logins", "identity");
        modelBuilder.Entity<IdentityUserToken<string>>().ToTable("user_tokens", "identity");
        modelBuilder.HasDefaultSchema("cinemaR");
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
            entity.Property(auditorium => auditorium.SupportedFormats).IsRequired();
        });
        modelBuilder.Entity<Showtime>(entity =>
        {
            entity.ToTable("showtimes", table =>
            {
                table.HasCheckConstraint("ck_showtime_interval", "occupied_until > starts_at");
                table.HasCheckConstraint("ck_showtime_format", "format IN ('2D', '3D', 'IMAX 2D', 'IMAX 3D')");
            });
            entity.HasKey(showtime => showtime.Id);
            entity.Property(showtime => showtime.Format).HasMaxLength(16).HasDefaultValue("2D").IsRequired();
            entity.Property(showtime => showtime.ScheduledDurationMinutes)
                .HasComputedColumnSql("(EXTRACT(EPOCH FROM (occupied_until - starts_at)) / 60)::integer - 15", stored: true);
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
        modelBuilder.Entity<ConfirmedBooking>(entity =>
        {
            entity.ToTable("bookings", "booking");
            entity.HasKey(booking => booking.Id);
            entity.Property(booking => booking.Id).ValueGeneratedNever();
            entity.Property(booking => booking.Email).HasMaxLength(254).IsRequired();
            entity.HasOne<CinemaRUser>().WithMany().HasForeignKey(booking => booking.CustomerId).OnDelete(DeleteBehavior.Restrict);
            entity.Property(booking => booking.ConfirmationToken).HasMaxLength(64).IsRequired();
            entity.HasIndex(booking => booking.ConfirmationToken).IsUnique();
            entity.HasOne(booking => booking.Showtime).WithMany().HasForeignKey(booking => booking.ShowtimeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasAlternateKey(booking => new { booking.Id, booking.ShowtimeId });
        });
        modelBuilder.Entity<BookedSeat>(entity =>
        {
            entity.ToTable("booked_seats", "booking");
            entity.HasKey(seat => new { seat.ShowtimeId, seat.SeatId });
            entity.Property(seat => seat.TicketCode).HasMaxLength(64).IsRequired();
            entity.HasIndex(seat => seat.TicketCode).IsUnique();
            entity.HasOne(seat => seat.Booking).WithMany(booking => booking.Seats)
                .HasForeignKey(seat => new { seat.BookingId, seat.ShowtimeId })
                .HasPrincipalKey(booking => new { booking.Id, booking.ShowtimeId }).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(seat => seat.Seat).WithMany().HasForeignKey(seat => seat.SeatId).OnDelete(DeleteBehavior.Restrict);
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
