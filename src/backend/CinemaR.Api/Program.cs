using CinemaR.Application.Movies.Services;
using CinemaR.Application.Auditoriums.Services;
using CinemaR.Application.Showtimes.Services;
using CinemaR.Application.Booking.Services;
using CinemaR.Infrastructure.Identity.Setup;
using CinemaR.Infrastructure;
using CinemaR.Api;
using CinemaR.Infrastructure.Identity;

var builder = WebApplication.CreateBuilder(args.Where(arg => arg != "setup-admin").ToArray());
builder.Services.AddControllers();
builder.Services.AddCinemaRIdentity();
builder.AddCinemaRSecurity();
builder.Services.AddProblemDetails();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment.IsDevelopment());
builder.Services.AddScoped<IShowtimesService, ShowtimesService>();
builder.Services.AddScoped<ISeatMapService, SeatMapService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IMovieService, MovieService>();
builder.Services.AddScoped<IAuditoriumService, AuditoriumService>();
builder.Services.AddScoped<IShowtimeManagementService, ShowtimeManagementService>();
builder.Services.AddScoped<IBookingManagementService, BookingManagementService>();
builder.Services.AddScoped<IMyBookingsService, MyBookingsService>();
builder.Services.AddSingleton(TimeProvider.System);

var app = builder.Build();
app.UseExceptionHandler();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseCinemaRCsrf();
app.MapHealthChecks("/health", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready");
app.MapControllers();

// Local development only: schema and one-time sample data are ready before serving requests.
if (app.Environment.IsDevelopment())
{
    await app.Services.InitializeDatabaseAsync();
}
if (args.Contains("setup-admin"))
{
    Environment.ExitCode = await AdministratorSetup.RunAsync(app.Services);
    return;
}
app.Run();

// Expose the entry point to the in-process HTTP test host.
public partial class Program;
