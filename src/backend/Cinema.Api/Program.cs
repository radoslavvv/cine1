using Cinema.Application.Admin;
using Cinema.Application.Booking.Services;
using Cinema.Application.Schedule.Services;
using Cinema.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment.IsDevelopment());
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<ISeatMapService, SeatMapService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddSingleton(TimeProvider.System);

var app = builder.Build();
app.UseExceptionHandler();
// Unauthenticated administration must never be reachable outside local development.
app.Use(async (context, next) =>
{
    if (!app.Environment.IsDevelopment() &&
        (context.Request.Path.StartsWithSegments("/api/admin") || context.Request.Path.StartsWithSegments("/admin")))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }
    await next(context);
});
app.MapHealthChecks("/health", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready");
app.MapControllers();

// Local development only: schema and one-time sample data are ready before serving requests.
if (app.Environment.IsDevelopment())
{
    await app.Services.InitializeDatabaseAsync();
}
app.Run();
