using Cinema.Application.Admin.Services;
using Cinema.Infrastructure.Identity.Setup;
using Cinema.Application.Booking.Services;
using Cinema.Application.Schedule.Services;
using Cinema.Infrastructure;
using Cinema.Api;
using Cinema.Infrastructure.Identity;

var builder = WebApplication.CreateBuilder(args.Where(arg => arg != "setup-admin").ToArray());
builder.Services.AddControllers();
builder.Services.AddCinemaIdentity();
builder.AddCinemaSecurity();
builder.Services.AddProblemDetails();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment.IsDevelopment());
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<ISeatMapService, SeatMapService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddSingleton(TimeProvider.System);

var app = builder.Build();
app.UseExceptionHandler();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseCinemaCsrf();
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
