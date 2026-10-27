using Cinema.Api.Data;
using Cinema.Api.Data.Repositories;
using Cinema.Api.Schedule.Repositories;
using Cinema.Api.Schedule.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("postgresql", tags: ["ready"]);
builder.Services.AddDbContext<CatalogDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("Cinema")
        ?? throw new InvalidOperationException("Set ConnectionStrings: Cinema before starting the API."),
        postgres => postgres.MigrationsHistoryTable("__ef_migrations_history", "catalog"));
    if (builder.Environment.IsDevelopment())
    {
        options.UseSeeding((context, _) => CatalogSeed.RunAsync((CatalogDbContext)context, CancellationToken.None).GetAwaiter().GetResult());
        options.UseAsyncSeeding((context, _, cancellationToken) => CatalogSeed.RunAsync((CatalogDbContext)context, cancellationToken));
    }
});
builder.Services.AddScoped<IShowtimeRepository, ShowtimeRepository>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();

var app = builder.Build();
app.UseExceptionHandler();
app.MapHealthChecks("/health", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready");
app.MapControllers();

// Local development only: schema and one-time sample data are ready before serving requests.
if (app.Environment.IsDevelopment())
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<CatalogDbContext>().Database.MigrateAsync();
}
app.Run();
