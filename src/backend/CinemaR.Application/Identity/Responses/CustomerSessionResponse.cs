namespace CinemaR.Application.Identity.Responses;

public sealed record CustomerSessionResponse(string Id, string Email, bool IsAdministrator);
