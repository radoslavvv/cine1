using CinemaR.Application.Booking.Queries;
using CinemaR.Application.Movies.Responses;
using CinemaR.Application.Movies.Commands;
using CinemaR.Application.Auditoriums.Responses;
using CinemaR.Application.Auditoriums.Commands;
using CinemaR.Application.Showtimes.Responses;
using CinemaR.Application.Showtimes.Commands;
using CinemaR.Application.Booking.Responses;
using CinemaR.Api.Admin.Filters;
using CinemaR.Application.Movies.Services;
using CinemaR.Application.Auditoriums.Services;
using CinemaR.Application.Showtimes.Services;
using CinemaR.Application.Booking.Services;
using CinemaR.Api.Requests.Movies;
using CinemaR.Api.Requests.Auditoriums;
using CinemaR.Api.Requests.Showtimes;
using Microsoft.AspNetCore.Mvc;

namespace CinemaR.Api.Controllers;

[ApiController]
[Microsoft.AspNetCore.Authorization.Authorize(Policy = "Administrator")]
[Route("api/admin")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[TypeFilter(typeof(AdminExceptionFilter))]
public sealed class AdminController(IMovieService movies, IAuditoriumService auditoriums, IShowtimeManagementService showtimes, IBookingManagementService booking) : ControllerBase
{
    [HttpGet("movies")]
    public Task<IReadOnlyList<AdminMovieResponse>> Movies(CancellationToken ct)
    {
        return movies.MoviesAsync(ct);
    }

    [HttpGet("auditoriums")]
    public Task<IReadOnlyList<AdminAuditoriumResponse>> Auditoriums(CancellationToken ct)
    {
        return auditoriums.AuditoriumsAsync(ct);
    }

    [HttpGet("showtimes")]
    public Task<IReadOnlyList<AdminShowtimeResponse>> Showtimes([FromQuery] string date, CancellationToken ct)
    {
        return showtimes.ShowtimesAsync(date, ct);
    }

    [HttpPost("movies")]
    public Task<int> CreateMovie(SaveMovieRequest input, CancellationToken ct)
    {
        return movies.SaveMovieAsync(null, new SaveMovieCommand(input.Title, input.DurationMinutes, input.Genres, input.Synopsis, input.PosterUrl, input.BackdropUrl), ct);
    }

    [HttpPut("movies/{id:int}")]
    public Task<int> UpdateMovie(int id, SaveMovieRequest input, CancellationToken ct)
    {
        return movies.SaveMovieAsync(id, new SaveMovieCommand(input.Title, input.DurationMinutes, input.Genres, input.Synopsis, input.PosterUrl, input.BackdropUrl), ct);
    }

    [HttpPost("movies/{id:int}/archive")]
    public Task<int> ArchiveMovie(int id, CancellationToken ct)
    {
        return movies.ArchiveMovieAsync(id, ct);
    }

    [HttpDelete("movies/{id:int}")]
    public Task<int> DeleteMovie(int id, CancellationToken ct)
    {
        return movies.DeleteMovieAsync(id, ct);
    }

    [HttpPost("auditoriums")]
    public Task<int> CreateAuditorium(SaveAuditoriumRequest input, CancellationToken ct)
    {
        return auditoriums.SaveAuditoriumAsync(null, new SaveAuditoriumCommand(input.Name, input.Rows, input.SeatsPerRow, input.SupportedFormats, input.ReplaceLayout), ct);
    }

    [HttpPut("auditoriums/{id:int}")]
    public Task<int> UpdateAuditorium(int id, SaveAuditoriumRequest input, CancellationToken ct)
    {
        return auditoriums.SaveAuditoriumAsync(id, new SaveAuditoriumCommand(input.Name, input.Rows, input.SeatsPerRow, input.SupportedFormats, input.ReplaceLayout), ct);
    }

    [HttpPost("auditoriums/{id:int}/retire")]
    public Task<int> RetireAuditorium(int id, CancellationToken ct)
    {
        return auditoriums.RetireAuditoriumAsync(id, ct);
    }

    [HttpDelete("auditoriums/{id:int}")]
    public Task<int> DeleteAuditorium(int id, CancellationToken ct)
    {
        return auditoriums.DeleteAuditoriumAsync(id, ct);
    }

    [HttpPost("showtimes")]
    public Task<int[]> CreateShowtimes(SaveShowtimesRequest input, CancellationToken ct)
    {
        return showtimes.SaveShowtimesAsync(null, new SaveShowtimesCommand(input.MovieId, input.AuditoriumId, input.Format, input.LocalTime, input.Dates), ct);
    }

    [HttpPut("showtimes/{id:int}")]
    public Task<int[]> UpdateShowtime(int id, SaveShowtimesRequest input, CancellationToken ct)
    {
        return showtimes.SaveShowtimesAsync(id, new SaveShowtimesCommand(input.MovieId, input.AuditoriumId, input.Format, input.LocalTime, input.Dates), ct);
    }

    [HttpPost("showtimes/{id:int}/cancel")]
    public Task<int> CancelShowtime(int id, CancellationToken ct)
    {
        return showtimes.CancelShowtimeAsync(id, ct);
    }

    [HttpGet("bookings")]
    public Task<BookingPageResponse> Bookings([FromQuery] GetBookingsQuery filters, CancellationToken ct)
    {
        return booking.BookingsAsync(filters, ct);
    }

    [HttpGet("bookings/{id:guid}")]
    public Task<AdminBookingResponse> Booking(Guid id, CancellationToken ct)
    {
        return booking.BookingAsync(id, ct);
    }
}
