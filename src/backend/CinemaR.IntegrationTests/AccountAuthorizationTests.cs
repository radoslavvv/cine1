using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CinemaR.Application.Booking.Responses;
using CinemaR.Infrastructure.Identity.Entities;
using CinemaR.IntegrationTests.Support;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CinemaR.IntegrationTests;

public sealed class AccountAuthorizationTests
{
    [Fact]
    public async Task Signed_in_customer_is_denied_admin_access_and_bookings_use_verified_identity()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        await using var factory = new PostgresApiFactory(database, cinema.Clock);
        using (var scope = factory.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<CinemaRUser>>();
            var created = await users.CreateAsync(new CinemaRUser
            {
                Id = "customer",
                UserName = "customer@example.test",
                Email = "customer@example.test",
                EmailConfirmed = true
            }, "Test-Password-123");
            Assert.True(created.Succeeded, string.Join(", ", created.Errors.Select(error => error.Description)));
        }
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await SetCsrfAsync(client);
        var signIn = await client.PostAsJsonAsync("/api/account/sign-in", new
        {
            email = "customer@example.test",
            password = "Test-Password-123"
        });
        Assert.Equal(HttpStatusCode.OK, signIn.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/admin/bookings")).StatusCode);
        await SetCsrfAsync(client);

        var booking = await client.PostAsJsonAsync($"/api/showtimes/{cinema.ShowtimeId}/bookings", new
        {
            requestId = Guid.NewGuid(),
            email = "forged@example.test",
            seatIds = new[] { cinema.SeatIds[0] },
            expectedCustomerId = "customer"
        });
        Assert.Equal(HttpStatusCode.OK, booking.StatusCode);
        var confirmation = await booking.Content.ReadFromJsonAsync<BookingConfirmationResponse>();
        Assert.Equal("customer@example.test", confirmation!.Email);
        var history = await client.GetFromJsonAsync<BookingHistoryResponse>("/api/account/bookings");
        Assert.Equal(confirmation.ConfirmationToken, Assert.Single(history!.Items).ConfirmationToken);

        // A session-consistency guard is not permission to adopt somebody else's identity.
        var forgedOwner = await client.PostAsJsonAsync($"/api/showtimes/{cinema.ShowtimeId}/bookings", new
        {
            requestId = Guid.NewGuid(),
            email = "customer@example.test",
            seatIds = new[] { cinema.SeatIds[1] },
            expectedCustomerId = "another-customer"
        });
        Assert.Equal(HttpStatusCode.Conflict, forgedOwner.StatusCode);
        Assert.Single((await cinema.SeatsAsync())!.Seats.Where(seat => seat.Taken));
    }

    private static async Task SetCsrfAsync(HttpClient client)
    {
        var session = await client.GetFromJsonAsync<JsonElement>("/api/account/session");
        client.DefaultRequestHeaders.Remove("X-CSRF-Token");
        client.DefaultRequestHeaders.Add("X-CSRF-Token", session.GetProperty("csrfToken").GetString());
    }
}
