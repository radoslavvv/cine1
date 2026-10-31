using CinemaR.Application.SeatMaps.Repositories;
using CinemaR.Infrastructure.Data.MigrationHistory;
using CinemaR.Infrastructure.Data.HealthChecks;
using CinemaR.Infrastructure.Data.Seeding;
using CinemaR.Infrastructure.Data.Contexts;
using Microsoft.EntityFrameworkCore.Migrations;
using CinemaR.Application.Movies.Repositories;
using CinemaR.Application.Auditoriums.Repositories;
using CinemaR.Application.Showtimes.Repositories;
using CinemaR.Application.Booking.Repositories;
using CinemaR.Infrastructure.Data.Repositories;
using CinemaR.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaR.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddCinemaRInfrastructure(this IServiceCollection services, IConfiguration configuration, bool isDevelopment)
    {
        services.AddCinemaRIdentity();
        services.AddDbContext<CinemaRDbContext>(options =>
        {
            options.ReplaceService<IHistoryRepository, CinemaRHistoryRepository>();
            options.UseNpgsql(configuration.GetConnectionString("CinemaR")
                ?? throw new InvalidOperationException("Set ConnectionStrings: CinemaR before starting the API."),
                postgres => postgres.MigrationsHistoryTable("__ef_migrations_history", "cinemaR"));
            if (isDevelopment)
            {
                options.UseSeeding((context, _) => CinemaRSeed.RunAsync((CinemaRDbContext)context, CancellationToken.None).GetAwaiter().GetResult());
                options.UseAsyncSeeding((context, _, ct) => CinemaRSeed.RunAsync((CinemaRDbContext)context, ct));
            }
        });
        services.AddScoped<IShowtimeRepository, ShowtimeRepository>();
        services.AddScoped<ISeatMapRepository, SeatMapRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IMyBookingsRepository, MyBookingsRepository>();
        services.AddScoped<IMovieRepository, MovieRepository>();
        services.AddScoped<IAuditoriumRepository, AuditoriumRepository>();
        services.AddScoped<IShowtimeManagementRepository, ShowtimeManagementRepository>();
        services.AddScoped<IBookingManagementRepository, BookingManagementRepository>();
        services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("postgresql", tags: ["ready"]);
        return services;
    }

    public static async Task InitializeDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<CinemaRDbContext>().Database.MigrateAsync(cancellationToken);
    }
}
