using System.ComponentModel.DataAnnotations;

namespace CinemaR.Api.Requests;

public sealed record AccountCredentialsRequest([Required, EmailAddress, MaxLength(254)] string Email, [Required, MaxLength(128)] string Password);
