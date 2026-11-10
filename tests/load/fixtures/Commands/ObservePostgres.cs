using System.Text.Json;
using Npgsql;

namespace CinemaR.LoadTests.Commands;

internal static class ObservePostgres
{
    public static async Task ExecuteAsync(LoadTestRun run)
    {
        // Sample lock waits without logging SQL, customer data, cookies, or confirmation tokens.
        await using var observer = new NpgsqlConnection(run.ConnectionString);
        await observer.OpenAsync();
        await using var output = new StreamWriter(Path.Combine(run.OutputDirectory, "postgres-samples.jsonl"));
        output.AutoFlush = true;
        for (var sample = 0; sample < 900; sample++)
        {
            await using var query = new NpgsqlCommand("""
                SELECT count(*) FILTER (WHERE state = 'active'),
                       count(*) FILTER (WHERE wait_event_type = 'Lock'),
                       count(*)
                FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()
                """, observer);
            await using (var reader = await query.ExecuteReaderAsync())
            {
                await reader.ReadAsync();
                await output.WriteLineAsync(JsonSerializer.Serialize(new
                {
                    at = DateTimeOffset.UtcNow,
                    active = reader.GetInt64(0),
                    lockWaiting = reader.GetInt64(1),
                    connections = reader.GetInt64(2)
                }));
            }
            await Task.Delay(TimeSpan.FromSeconds(1));
        }
    }
}
