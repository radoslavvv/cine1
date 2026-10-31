using Cinema.Infrastructure.Identity.Entities;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Cinema.Infrastructure.Identity.Authentication;

public sealed class CinemaClaimsFactory(UserManager<CinemaUser> users, IOptions<IdentityOptions> options)
    : UserClaimsPrincipalFactory<CinemaUser>(users, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(CinemaUser user)
    {
        var identity = await base.GenerateClaimsAsync(user);
        if (user.IsAdministrator) identity.AddClaim(new Claim("cinema:administrator", "true"));
        return identity;
    }
}
