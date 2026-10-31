namespace Cinema.Application.Identity.Contracts;

public sealed record CustomerSession(string Id, string Email, bool IsAdministrator);
