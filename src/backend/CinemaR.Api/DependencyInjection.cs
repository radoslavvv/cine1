using CinemaR.Application.SeatMaps.Services;
using CinemaR.Api.Security;
using CinemaR.Application.Auditoriums.Services;
using CinemaR.Application.Booking.Services;
using CinemaR.Application.Movies.Services;
using CinemaR.Application.Showtimes.Services;

namespace CinemaR.Api;

public static class DependencyInjection
{
    public static WebApplicationBuilder AddCinemaRApi(this WebApplicationBuilder builder)
    {
        builder.Services.AddControllers();
        builder.Services.AddProblemDetails();
        builder.AddCinemaRSecurity();
        builder.Services.AddScoped<IShowtimesService, ShowtimesService>();
        builder.Services.AddScoped<ISeatMapService, SeatMapService>();
        builder.Services.AddScoped<IBookingService, BookingService>();
        builder.Services.AddScoped<IMovieService, MovieService>();
        builder.Services.AddScoped<IAuditoriumService, AuditoriumService>();
        builder.Services.AddScoped<IShowtimeManagementService, ShowtimeManagementService>();
        builder.Services.AddScoped<IBookingManagementService, BookingManagementService>();
        builder.Services.AddScoped<IMyBookingsService, MyBookingsService>();
        builder.Services.AddSingleton(TimeProvider.System);
        return builder;
    }
}
