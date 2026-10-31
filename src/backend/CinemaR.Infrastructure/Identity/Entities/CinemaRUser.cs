using Microsoft.AspNetCore.Identity;

namespace CinemaR.Infrastructure.Identity.Entities;

public sealed class CinemaRUser : IdentityUser
{
    public bool IsAdministrator { get; set; }
}
