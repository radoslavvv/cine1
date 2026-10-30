using Cinema.Application.Admin;
using Cinema.Api.Admin;
using Cinema.Api.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers;

[ApiController]
[Route("api/admin")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[TypeFilter(typeof(AdminExceptionFilter))]
public sealed class AdminController(IAdminService service) : ControllerBase
{
    [HttpGet("catalog")]
    public Task<AdminCatalog> Catalog(CancellationToken ct) => service.CatalogAsync(ct);

    [HttpGet("showtimes")]
    public Task<IReadOnlyList<AdminShowtime>> Showtimes([FromQuery] string date, CancellationToken ct) =>
        service.ShowtimesAsync(date, ct);

    [HttpPost("movies")]
    public Task<int> CreateMovie(MovieRequest input, CancellationToken ct) => service.SaveMovieAsync(null, new SaveMovieCommand(input.Title, input.DurationMinutes, input.Genres, input.Synopsis, input.PosterUrl, input.BackdropUrl), ct);

    [HttpPut("movies/{id:int}")]
    public Task<int> UpdateMovie(int id, MovieRequest input, CancellationToken ct) => service.SaveMovieAsync(id, new SaveMovieCommand(input.Title, input.DurationMinutes, input.Genres, input.Synopsis, input.PosterUrl, input.BackdropUrl), ct);

    [HttpPost("movies/{id:int}/archive")]
    public Task<int> ArchiveMovie(int id, CancellationToken ct) => service.ArchiveMovieAsync(id, ct);

    [HttpDelete("movies/{id:int}")]
    public Task<int> DeleteMovie(int id, CancellationToken ct) => service.DeleteMovieAsync(id, ct);

    [HttpPost("auditoriums")]
    public Task<int> CreateAuditorium(AuditoriumRequest input, CancellationToken ct) => service.SaveAuditoriumAsync(null, new SaveAuditoriumCommand(input.Name, input.Rows, input.SeatsPerRow, input.SupportedFormats, input.ReplaceLayout), ct);

    [HttpPut("auditoriums/{id:int}")]
    public Task<int> UpdateAuditorium(int id, AuditoriumRequest input, CancellationToken ct) => service.SaveAuditoriumAsync(id, new SaveAuditoriumCommand(input.Name, input.Rows, input.SeatsPerRow, input.SupportedFormats, input.ReplaceLayout), ct);

    [HttpPost("auditoriums/{id:int}/retire")]
    public Task<int> RetireAuditorium(int id, CancellationToken ct) => service.RetireAuditoriumAsync(id, ct);

    [HttpDelete("auditoriums/{id:int}")]
    public Task<int> DeleteAuditorium(int id, CancellationToken ct) => service.DeleteAuditoriumAsync(id, ct);

    [HttpPost("showtimes")]
    public Task<int[]> CreateShowtimes(ShowtimeRequest input, CancellationToken ct) => service.SaveShowtimesAsync(null, new SaveShowtimesCommand(input.MovieId, input.AuditoriumId, input.Format, input.LocalTime, input.Dates), ct);

    [HttpPut("showtimes/{id:int}")]
    public Task<int[]> UpdateShowtime(int id, ShowtimeRequest input, CancellationToken ct) => service.SaveShowtimesAsync(id, new SaveShowtimesCommand(input.MovieId, input.AuditoriumId, input.Format, input.LocalTime, input.Dates), ct);

    [HttpPost("showtimes/{id:int}/cancel")]
    public Task<int> CancelShowtime(int id, CancellationToken ct) => service.CancelShowtimeAsync(id, ct);

    [HttpGet("bookings")]
    public Task<BookingPage> Bookings([FromQuery] BookingFilters filters, CancellationToken ct) => service.BookingsAsync(filters, ct);

    [HttpGet("bookings/{id:guid}")]
    public Task<AdminBooking> Booking(Guid id, CancellationToken ct) => service.BookingAsync(id, ct);
}
