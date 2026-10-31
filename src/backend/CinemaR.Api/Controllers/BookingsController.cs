using CinemaR.Application.Identity.Services;
using CinemaR.Application.Booking.Results;
using CinemaR.Application.Booking.Contracts;
using CinemaR.Application.Booking.Services;
using Microsoft.AspNetCore.Mvc;
using QRCoder;
using CinemaR.Api.Requests;
using CinemaR.Application.Booking.Commands;

namespace CinemaR.Api.Controllers;

[ApiController]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class BookingsController(IBookingService service, IAccountService accounts) : ControllerBase
{
    [HttpPost("api/showtimes/{showtimeId:int}/bookings")]
    public async Task<ActionResult<BookingConfirmation>> Confirm(int showtimeId, ConfirmBookingRequest request, CancellationToken cancellationToken)
    {
        var customer = await accounts.CurrentAsync();
        if (request.ExpectedCustomerId != customer?.Id)
            return Problem(statusCode: customer is null ? 401 : 409, title: "Your sign-in changed. Sign in again or explicitly continue as a guest.",
                extensions: new Dictionary<string, object?> { ["code"] = "session_changed" });
        var result = await service.ConfirmAsync(new ConfirmBookingCommand(showtimeId, request.RequestId,
            customer?.Email ?? request.Email, request.SeatIds, customer?.Id), cancellationToken);
        return result.Outcome switch
        {
            BookingOutcome.Confirmed => Ok(result.Confirmation),
            BookingOutcome.NotFound => Problem(statusCode: 404, title: "Showtime not found."),
            BookingOutcome.Cancelled => Problem(statusCode: 409, title: "This screening has been cancelled.", extensions: new Dictionary<string, object?> { ["code"] = "showtime_cancelled" }),
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

    [HttpGet("api/bookings/{confirmationToken}/tickets/{seatId:int}/qr")]
    public async Task<IActionResult> GetTicketQr(string confirmationToken, int seatId, CancellationToken cancellationToken)
    {
        Response.Headers["Referrer-Policy"] = "no-referrer";
        var booking = await service.FindAsync(confirmationToken, cancellationToken);
        var ticket = booking?.Tickets.SingleOrDefault(item => item.SeatId == seatId);
        if (booking?.IsCancelled == true) return Problem(statusCode: 410, title: "This screening has been cancelled. Its tickets are no longer valid.");
        if (ticket is null) return Problem(statusCode: 404, title: "Ticket not found.");

        using var data = QRCodeGenerator.GenerateQrCode(ticket.TicketCode, QRCodeGenerator.ECCLevel.M);
        using var qr = new PngByteQRCode(data);
        return File(qr.GetGraphic(8), "image/png");
    }
}
