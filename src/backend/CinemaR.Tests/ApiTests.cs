using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CinemaR.Application.Booking.Responses;
using CinemaR.Application.Booking.Repositories;
using CinemaR.Application.Booking.Results;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;
using Microsoft.AspNetCore.DataProtection;

namespace CinemaR.Tests;

// Keep real routing, JSON, validation, controllers and application services.
// Only persistence is replaced; PostgreSQL behavior needs separate integration tests.
public sealed class ApiTests
{
    [Theory]
    [InlineData("not-an-email", new[] { 1 })]
    [InlineData("customer@example.com", new int[0])]
    [InlineData("customer@example.com", new[] { 1, 2, 3, 4, 5, 6, 7, 8, 9 })]
    public async Task Invalid_request_models_return_validation_problem_before_persistence(string email, int[] seats)
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await PostAsync(client, "/api/showtimes/1/bookings", new
        {
            requestId = Guid.NewGuid(),
            email,
            seatIds = seats
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.True(problem
            .GetProperty("errors")
            .EnumerateObject()
            .Any());
        Assert.False(factory.Repository.Called);
    }

    [Theory]
    [InlineData(BookingOutcome.Started, "showtime_started")]
    [InlineData(BookingOutcome.Cancelled, "showtime_cancelled")]
    [InlineData(BookingOutcome.SeatsTaken, "seats_taken")]
    [InlineData(BookingOutcome.RequestConflict, "request_conflict")]
    public async Task Booking_conflicts_expose_the_codes_used_by_checkout(BookingOutcome outcome, string code)
    {
        using var factory = new ApiFactory();

        factory.Repository.Outcome = outcome;

        using var client = factory.CreateClient();
        var response = await PostAsync(client, "/api/showtimes/1/bookings", new
        {
            requestId = Guid.NewGuid(),
            email = "customer@example.com",
            seatIds = new[] { 1 }
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(code, problem.GetProperty("code").GetString());
        Assert.True(factory.Repository.Called);
        Assert.Contains("no-store", response.Headers.CacheControl!.ToString());
    }

    [Theory]
    [InlineData("/api/showtimes?format=2D")]
    [InlineData("/api/showtimes?date=not-a-date&format=2D")]
    [InlineData("/api/showtimes?date=2026-10-30&format=unknown")]
    public async Task Invalid_showtimes_filters_return_problem_details(string url)
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync(url);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Theory]
    [InlineData("/api/admin/movies")]
    [InlineData("/api/account/bookings")]
    public async Task Private_endpoints_require_sign_in_in_production(string url)
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(url)).StatusCode);
    }

    [Fact]
    public async Task Guest_writes_require_a_valid_csrf_token()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/showtimes/1/bookings", new
        {
            requestId = Guid.NewGuid(),
            email = "customer@example.com",
            seatIds = new[] { 1 }
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("csrf_invalid", problem.GetProperty("code").GetString());
        Assert.False(factory.Repository.Called);
    }

    [Fact]
    public async Task Expired_or_forged_customer_cannot_silently_create_a_guest_booking()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await PostAsync(client, "/api/showtimes/1/bookings", new
        {
            requestId = Guid.NewGuid(),
            email = "customer@example.com",
            seatIds = new[] { 1 },
            expectedCustomerId = "another-customer"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.False(factory.Repository.Called);
    }

    private static async Task<HttpResponseMessage> PostAsync(HttpClient client, string url, object body)
    {
        var session = await client.GetFromJsonAsync<JsonElement>("/api/account/session");

        client.DefaultRequestHeaders.Remove("X-CSRF-Token");
        client.DefaultRequestHeaders.Add("X-CSRF-Token", session.GetProperty("csrfToken").GetString());

        return await client.PostAsJsonAsync(url, body);
    }

    [Fact]
    public async Task Unknown_confirmation_returns_private_uncached_problem()
    {
        using var factory = new ApiFactory();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/bookings/unknown-token");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("no-referrer", Assert.Single(response.Headers.GetValues("Referrer-Policy")));
        Assert.Contains("no-store", response.Headers.CacheControl!.ToString());
    }

    private sealed class ApiFactory : WebApplicationFactory<Program>
    {
        public ApiFactory()
        {
            ClientOptions.BaseAddress = new Uri("https://localhost");
        }

        public BookingRepositoryStub Repository { get; } = new();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Production avoids Development startup migrations/seeding. Never connect to a local database.
            builder.UseEnvironment("Production");
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CinemaR"] = "Host=localhost;Database=unused;Username=unused;Password=unused"
            }));
            builder.ConfigureServices(services =>
            {
                services.Replace(ServiceDescriptor.Singleton<IBookingRepository>(Repository));
                services.AddDataProtection().UseEphemeralDataProtectionProvider();
            });
        }
    }

    private sealed class BookingRepositoryStub : IBookingRepository
    {
        public BookingOutcome Outcome { get; set; } = BookingOutcome.Confirmed;

        public bool Called { get; private set; }

        public Task<BookingResult> ConfirmAsync(int id, Guid requestId, string email, int[] seats, CancellationToken ct, string? customerId = null)
        {
            Called = true;

            return Task.FromResult(new BookingResult(Outcome));
        }

        public Task<BookingConfirmationResponse?> FindAsync(string token, CancellationToken ct)
        {
            return Task.FromResult<BookingConfirmationResponse?>(null);
        }
    }
}
