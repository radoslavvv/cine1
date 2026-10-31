using CinemaR.Infrastructure.Identity.Setup;
using CinemaR.Infrastructure;
using CinemaR.Api;
using CinemaR.Api.Security;

var builder = WebApplication.CreateBuilder(args
    .Where(arg => arg != "setup-admin")
    .ToArray());
builder.AddCinemaRApi();
builder.Services.AddCinemaRInfrastructure(builder.Configuration, builder.Environment.IsDevelopment());

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
