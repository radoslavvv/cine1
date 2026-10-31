namespace CinemaR.Application.Identity.Results;

public sealed record AccountResult(bool Succeeded, string Message, bool InvalidCredentials = false);
