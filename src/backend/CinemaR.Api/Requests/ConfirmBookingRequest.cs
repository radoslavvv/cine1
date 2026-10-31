using System.ComponentModel.DataAnnotations;

namespace CinemaR.Api.Requests;

public sealed record ConfirmBookingRequest(
    Guid RequestId,
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(1), MaxLength(8)] int[] SeatIds,
    [MaxLength(450)] string? ExpectedCustomerId = null);

