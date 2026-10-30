using Cinema.Application.Admin.Repositories;
using Cinema.Application.Admin;
using Cinema.Application.Booking.Repositories;
using Cinema.Application.Schedule.Repositories;
using Cinema.Infrastructure.Data;
using Cinema.Infrastructure.Data.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Cinema.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration, bool isDevelopment)
    {
        services.AddDbContext<CinemaRDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Cinema")
                ?? throw new InvalidOperationException("Set ConnectionStrings: Cinema before starting the API."),
                postgres => postgres.MigrationsHistoryTable("__ef_migrations_history", "catalog"));
            if (isDevelopment)
            {
                options.UseSeeding((context, _) => CatalogSeed.RunAsync((CinemaRDbContext)context, CancellationToken.None).GetAwaiter().GetResult());
                options.UseAsyncSeeding((context, _, ct) => CatalogSeed.RunAsync((CinemaRDbContext)context, ct));
            }
        });
        services.AddScoped<IShowtimeRepository, ShowtimeRepository>();
        services.AddScoped<ISeatMapRepository, SeatMapRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IAdminRepository, AdminRepository>();
        services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("postgresql", tags: ["ready"]);
        return services;
    }

    public static async Task InitializeDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<CinemaRDbContext>().Database.MigrateAsync(cancellationToken);
    }
}
