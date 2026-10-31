using CinemaR.Infrastructure.Identity.Entities;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace CinemaR.Infrastructure.Identity.Services;

public sealed class CinemaRClaimsFactory(UserManager<CinemaRUser> users, IOptions<IdentityOptions> options)
    : UserClaimsPrincipalFactory<CinemaRUser>(users, options)
{
    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(CinemaRUser user)
    {
        var identity = await base.GenerateClaimsAsync(user);
        if (user.IsAdministrator) identity.AddClaim(new Claim("cinema:administrator", "true"));
        return identity;
    }
}
