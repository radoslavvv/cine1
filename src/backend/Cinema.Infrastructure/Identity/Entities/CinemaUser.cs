using Microsoft.AspNetCore.Identity;

namespace Cinema.Infrastructure.Identity.Entities;

public sealed class CinemaUser : IdentityUser
{
    public bool IsAdministrator { get; set; }
}
