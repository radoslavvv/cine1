namespace Cinema.Application.Identity.Results;

public sealed record AccountResult(bool Succeeded, string Message, bool InvalidCredentials = false);
