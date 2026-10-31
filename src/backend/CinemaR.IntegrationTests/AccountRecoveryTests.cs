using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using CinemaR.Infrastructure.Identity.Entities;
using CinemaR.IntegrationTests.Support;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CinemaR.IntegrationTests;

public sealed class AccountRecoveryTests
{
    [Fact]
    public async Task Verification_enables_sign_in_and_password_reset_revokes_sessions_and_cannot_be_reused()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var clock = new TestClock();
        await using var factory = new PostgresApiFactory(database, clock);
        string verification;
        using (var scope = factory.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<CinemaRUser>>();
            var user = new CinemaRUser { Id = "customer", UserName = "customer@example.test", Email = "customer@example.test" };
            Assert.True((await users.CreateAsync(user, "Original-Password-123")).Succeeded);
            // Model the token received from email; SMTP delivery is outside this test boundary.
            verification = Encode(await users.GenerateEmailConfirmationTokenAsync(user));
        }
        using var customer = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await SetCsrfAsync(customer);
        var credentials = new { email = "customer@example.test", password = "Original-Password-123" };
        Assert.Equal(HttpStatusCode.Unauthorized, (await customer.PostAsJsonAsync("/api/account/sign-in", credentials)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await customer.PostAsJsonAsync("/api/account/verify-email", new { userId = "customer", token = verification })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await customer.PostAsJsonAsync("/api/account/sign-in", credentials)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await customer.GetAsync("/api/account/bookings")).StatusCode);

        string resetToken;
        using (var scope = factory.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<CinemaRUser>>();
            resetToken = Encode(await users.GeneratePasswordResetTokenAsync((await users.FindByIdAsync("customer"))!));
        }
        using var recovery = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await SetCsrfAsync(recovery);
        var reset = new { email = "customer@example.test", token = resetToken, password = "Replacement-Password-456" };
        Assert.Equal(HttpStatusCode.OK, (await recovery.PostAsJsonAsync("/api/account/reset-password", reset)).StatusCode);
        // Security-stamp validation requires elapsed time even with a zero validation interval.
        clock.Now = clock.Now.AddSeconds(1);
        Assert.Equal(HttpStatusCode.Unauthorized, (await customer.GetAsync("/api/account/bookings")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await recovery.PostAsJsonAsync("/api/account/reset-password", reset)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await recovery.PostAsJsonAsync("/api/account/sign-in", credentials)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await recovery.PostAsJsonAsync("/api/account/sign-in", new { reset.email, reset.password })).StatusCode);
    }

    private static string Encode(string token)
    {
        return WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
    }

    private static async Task SetCsrfAsync(HttpClient client)
    {
        var session = await client.GetFromJsonAsync<JsonElement>("/api/account/session");
        client.DefaultRequestHeaders.Add("X-CSRF-Token", session.GetProperty("csrfToken").GetString());
    }
}
