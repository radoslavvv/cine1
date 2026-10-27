using Cinema.Api.Schedule.Contracts;
using Cinema.Api.Schedule.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers;

[ApiController]
[Route("api/showtimes")]
public sealed class ShowtimesController(IScheduleService scheduleService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ShowtimeResponse>>> GetShowtimes([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var result = await scheduleService.GetForDateAsync(date, cancellationToken);
        if (result.ValidationError is not null)
            return Problem(statusCode: 400, title: "A valid date is required.", detail: result.ValidationError);
        return Ok(result.Showtimes);
    }
}

