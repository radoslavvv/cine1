using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CinemaR.Infrastructure.Data;

public sealed class DatabaseHealthCheck(CinemaRDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default) =>
        await db.Database.CanConnectAsync(cancellationToken)
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("PostgreSQL is unavailable.");
}
