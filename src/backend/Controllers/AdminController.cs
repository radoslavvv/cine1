using Cinema.Api.Admin;
using Cinema.Api.Data.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers;

[ApiController]
[Route("api/admin")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[TypeFilter(typeof(AdminExceptionFilter))]
public sealed class AdminController(AdminRepository repository) : ControllerBase
{
    [HttpGet("catalog")]
    public Task<AdminCatalog> Catalog(CancellationToken ct) => repository.CatalogAsync(ct);

    [HttpGet("showtimes")]
    public Task<IReadOnlyList<AdminShowtime>> Showtimes([FromQuery] string date, CancellationToken ct) =>
        repository.ShowtimesAsync(AdminValidation.Date(date), ct);

    [HttpPost("movies")]
    public Task<int> CreateMovie(MovieInput input, CancellationToken ct) => repository.SaveMovieAsync(null, AdminValidation.Movie(input), ct);

    [HttpPut("movies/{id:int}")]
    public Task<int> UpdateMovie(int id, MovieInput input, CancellationToken ct) => repository.SaveMovieAsync(id, AdminValidation.Movie(input), ct);

    [HttpPost("movies/{id:int}/archive")]
    public Task<int> ArchiveMovie(int id, CancellationToken ct) => repository.ArchiveMovieAsync(id, ct);

    [HttpDelete("movies/{id:int}")]
    public Task<int> DeleteMovie(int id, CancellationToken ct) => repository.DeleteMovieAsync(id, ct);

    [HttpPost("auditoriums")]
    public Task<int> CreateAuditorium(AuditoriumInput input, CancellationToken ct) => repository.SaveAuditoriumAsync(null, AdminValidation.Auditorium(input), ct);

    [HttpPut("auditoriums/{id:int}")]
    public Task<int> UpdateAuditorium(int id, AuditoriumInput input, CancellationToken ct) => repository.SaveAuditoriumAsync(id, AdminValidation.Auditorium(input), ct);

    [HttpPost("auditoriums/{id:int}/retire")]
    public Task<int> RetireAuditorium(int id, CancellationToken ct) => repository.RetireAuditoriumAsync(id, ct);

    [HttpDelete("auditoriums/{id:int}")]
    public Task<int> DeleteAuditorium(int id, CancellationToken ct) => repository.DeleteAuditoriumAsync(id, ct);

    [HttpPost("showtimes")]
    public Task<int[]> CreateShowtimes(ShowtimeInput input, CancellationToken ct) => repository.SaveShowtimesAsync(null, input, AdminValidation.Starts(input), ct);

    [HttpPut("showtimes/{id:int}")]
    public Task<int[]> UpdateShowtime(int id, ShowtimeInput input, CancellationToken ct) => repository.SaveShowtimesAsync(id, input, AdminValidation.Starts(input), ct);

    [HttpPost("showtimes/{id:int}/cancel")]
    public Task<int> CancelShowtime(int id, CancellationToken ct) => repository.CancelShowtimeAsync(id, ct);

    [HttpGet("bookings")]
    public Task<BookingPage> Bookings([FromQuery] BookingFilters filters, CancellationToken ct) => repository.BookingsAsync(filters, ct);

    [HttpGet("bookings/{id:guid}")]
    public Task<AdminBooking> Booking(Guid id, CancellationToken ct) => repository.BookingAsync(id, ct);
}
