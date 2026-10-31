using System.ComponentModel.DataAnnotations;

namespace CinemaR.Api.Requests.Identity;

public sealed record AccountEmailRequest([Required, EmailAddress, MaxLength(254)] string Email);
