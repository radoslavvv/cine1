using CinemaR.Infrastructure.Data.Contexts;
using CinemaR.Application.Identity.Services;
using CinemaR.Infrastructure.Identity.Entities;
using CinemaR.Infrastructure.Identity.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace CinemaR.Infrastructure.Identity;

public static class DependencyInjection
{
    public static IServiceCollection AddCinemaRIdentity(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddIdentityCore<CinemaRUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = true;
            options.Password.RequiredLength = 12;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        }).AddEntityFrameworkStores<CinemaRDbContext>().AddSignInManager().AddDefaultTokenProviders();
        services.AddScoped<IUserClaimsPrincipalFactory<CinemaRUser>, CinemaRClaimsFactory>();
        services.Configure<DataProtectionTokenProviderOptions>(options => options.TokenLifespan = TimeSpan.FromHours(1));
        services.AddScoped<AccountEmailSender>();
        services.AddScoped<IAccountService, AccountService>();

        return services;
    }
}
