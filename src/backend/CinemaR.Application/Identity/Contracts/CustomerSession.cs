namespace CinemaR.Application.Identity.Contracts;

public sealed record CustomerSession(string Id, string Email, bool IsAdministrator);
