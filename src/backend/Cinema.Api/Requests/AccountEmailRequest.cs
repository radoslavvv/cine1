using System.ComponentModel.DataAnnotations;

namespace Cinema.Api.Requests;

public sealed record AccountEmailRequest([Required, EmailAddress, MaxLength(254)] string Email);
