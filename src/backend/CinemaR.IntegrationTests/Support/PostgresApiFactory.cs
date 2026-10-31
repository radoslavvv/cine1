using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaR.IntegrationTests.Support;

internal sealed class PostgresApiFactory(PostgresDatabase database, TestClock clock) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Production exercises real authorization without Development seed expansion.
        builder.UseEnvironment("Production");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:CinemaR"] = database.ConnectionString
        }));
        builder.ConfigureServices(services =>
        {
            services.AddSingleton<TimeProvider>(clock);
            services.AddDataProtection().UseEphemeralDataProtectionProvider();
        });
    }
}
