using Cinema.Application.Schedule.Contracts;
using Cinema.Application.Schedule.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers;

[ApiController]
[Route("api/showtimes")]
public sealed class ShowtimesController(IScheduleService scheduleService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ShowtimeResponse>>> GetShowtimes(
        [FromQuery] DateOnly? date, [FromQuery] string? genre, [FromQuery] string? format, CancellationToken cancellationToken)
    {
        var result = await scheduleService.GetForDateAsync(new GetScheduleQuery(date, genre, format), cancellationToken);
        if (result.ValidationError is not null)
            return Problem(statusCode: 400, title: "Invalid schedule filters.", detail: result.ValidationError);
        return Ok(result.Showtimes);
    }
}

