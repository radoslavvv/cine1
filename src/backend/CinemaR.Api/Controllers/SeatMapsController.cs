using CinemaR.Application.SeatMaps.Responses;
using CinemaR.Application.SeatMaps.Services;
using Microsoft.AspNetCore.Mvc;

namespace CinemaR.Api.Controllers;

[ApiController]
[Route("api/showtimes/{showtimeId:int}/seats")]
public sealed class SeatMapsController(ISeatMapService service) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<SeatMapResponse>> Get(int showtimeId, CancellationToken cancellationToken)
    {
        var map = await service.GetAsync(showtimeId, cancellationToken);
        if (map is null) return Problem(statusCode: 404, title: "Showtime not found.");
        return Ok(map);
    }
}
