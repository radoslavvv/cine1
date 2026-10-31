using System.ComponentModel.DataAnnotations;

namespace CinemaR.Api.Requests.Identity;

public sealed record ResetPasswordRequest([Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MaxLength(4096)] string Token, [Required, MaxLength(128)] string Password);
