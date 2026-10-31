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

public sealed class TicketEndpointTests
{
    [Fact]
    public async Task Private_ticket_QR_is_uncached_and_becomes_gone_after_authorized_cancellation()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var booking = await cinema.BookAsync([cinema.SeatIds[0]]);
        await using var factory = new PostgresApiFactory(database, cinema.Clock);
        using var guest = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        var confirmationPath = "/api/bookings/" + booking.Confirmation!.ConfirmationToken;
        var qrPath = confirmationPath + $"/tickets/{cinema.SeatIds[0]}/qr";

        var qr = await guest.GetAsync(qrPath);
        Assert.Equal(HttpStatusCode.OK, qr.StatusCode);
        Assert.Equal("image/png", qr.Content.Headers.ContentType!.MediaType);
        Assert.Contains("no-store", qr.Headers.CacheControl!.ToString());
        Assert.Equal("no-referrer", Assert.Single(qr.Headers.GetValues("Referrer-Policy")));
        var png = await qr.Content.ReadAsByteArrayAsync();
        Assert.Equal(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }, png.Take(8));
        Assert.Equal(HttpStatusCode.NotFound, (await guest.GetAsync(confirmationPath + "/tickets/2147483647/qr")).StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<CinemaRUser>>();
            Assert.True((await users.CreateAsync(new CinemaRUser
            {
                Id = "administrator",
                UserName = "admin@example.test",
                Email = "admin@example.test",
                EmailConfirmed = true,
                IsAdministrator = true
            }, "Administrator-Password-123")).Succeeded);
        }
        using var administrator = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        await SetCsrfAsync(administrator);
        Assert.Equal(HttpStatusCode.OK, (await administrator.PostAsJsonAsync("/api/account/sign-in",
            new { email = "admin@example.test", password = "Administrator-Password-123" })).StatusCode);
        await SetCsrfAsync(administrator);
        Assert.Equal(HttpStatusCode.OK, (await administrator.PostAsJsonAsync($"/api/admin/showtimes/{cinema.ShowtimeId}/cancel", new { })).StatusCode);

        Assert.Equal(HttpStatusCode.Gone, (await guest.GetAsync(qrPath)).StatusCode);
        var retained = await guest.GetFromJsonAsync<BookingConfirmationResponse>(confirmationPath);
        Assert.True(retained!.IsCancelled);
        Assert.Empty(Assert.Single(retained.Tickets).TicketCode);
    }

    private static async Task SetCsrfAsync(HttpClient client)
    {
        var session = await client.GetFromJsonAsync<JsonElement>("/api/account/session");
        client.DefaultRequestHeaders.Remove("X-CSRF-Token");
        client.DefaultRequestHeaders.Add("X-CSRF-Token", session.GetProperty("csrfToken").GetString());
    }
}
