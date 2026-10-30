using System.ComponentModel.DataAnnotations;

namespace Cinema.Api.Requests;

public sealed record ConfirmBookingRequest(
    Guid RequestId,
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(1), MaxLength(8)] int[] SeatIds);

