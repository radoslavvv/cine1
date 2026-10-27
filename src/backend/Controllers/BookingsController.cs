using Cinema.Api.Booking.Contracts;
using Cinema.Api.Booking.Repositories;
using Cinema.Api.Booking.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers;

[ApiController]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class BookingsController(IBookingService service) : ControllerBase
{
    [HttpPost("api/showtimes/{showtimeId:int}/bookings")]
    public async Task<ActionResult<BookingConfirmation>> Confirm(int showtimeId, ConfirmBookingRequest request, CancellationToken cancellationToken)
    {
        var result = await service.ConfirmAsync(showtimeId, request, cancellationToken);
        return result.Outcome switch
        {
            BookingOutcome.Confirmed => Ok(result.Confirmation),
            BookingOutcome.NotFound => Problem(statusCode: 404, title: "Showtime not found."),
            BookingOutcome.Started => Problem(statusCode: 409, title: "This showtime has started.", extensions: new Dictionary<string, object?> { ["code"] = "showtime_started" }),
            BookingOutcome.SeatsTaken => Problem(statusCode: 409, title: "Some selected seats have been booked. Please choose again.", extensions: new Dictionary<string, object?> { ["code"] = "seats_taken" }),
            BookingOutcome.RequestConflict => Problem(statusCode: 409, title: "This confirmation request was already used for another booking.", extensions: new Dictionary<string, object?> { ["code"] = "request_conflict" }),
            _ => Problem(statusCode: 400, title: "Choose between one and eight distinct seats from this auditorium and a valid request ID.")
        };
    }

    [HttpGet("api/bookings/{confirmationToken}")]
    public async Task<ActionResult<BookingConfirmation>> Get(string confirmationToken, CancellationToken cancellationToken)
    {
        Response.Headers["Referrer-Policy"] = "no-referrer";
        var booking = await service.FindAsync(confirmationToken, cancellationToken);
        return booking is null ? Problem(statusCode: 404, title: "Booking not found.") : Ok(booking);
    }
}
