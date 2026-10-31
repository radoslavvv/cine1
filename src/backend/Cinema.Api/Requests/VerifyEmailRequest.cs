using System.ComponentModel.DataAnnotations;

namespace Cinema.Api.Requests;

public sealed record VerifyEmailRequest([Required, MaxLength(450)] string UserId, [Required, MaxLength(4096)] string Token);
