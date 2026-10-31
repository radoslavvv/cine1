using CinemaR.Application.Showtimes.Queries;
using CinemaR.Application.Showtimes.Responses;
using CinemaR.Application.Showtimes.Services;
using Microsoft.AspNetCore.Mvc;

namespace CinemaR.Api.Controllers;

[ApiController]
[Route("api/showtimes")]
public sealed class ShowtimesController(IShowtimesService showtimesService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ShowtimeResponse>>> GetShowtimes(
        [FromQuery] DateOnly? date, [FromQuery] string? genre, [FromQuery] string? format, CancellationToken cancellationToken)
    {
        var result = await showtimesService.GetForDateAsync(new GetShowtimesQuery(date, genre, format), cancellationToken);

        if (result.ValidationError is not null)
        {
            return Problem(statusCode: 400, title: "Invalid showtimes filters.", detail: result.ValidationError);
        }

        return Ok(result.Showtimes);
    }
}

