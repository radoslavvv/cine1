using Cinema.Application.Identity.Services;
using Cinema.Infrastructure.Identity.Authentication;
using Cinema.Infrastructure.Identity.Email;
using Cinema.Infrastructure.Identity.Entities;
using Cinema.Infrastructure.Identity.Services;
using Cinema.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Cinema.Infrastructure.Identity;

public static class IdentityRegistration
{
    public static IServiceCollection AddCinemaIdentity(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddIdentityCore<CinemaUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = true;
            options.Password.RequiredLength = 12;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        }).AddEntityFrameworkStores<CinemaRDbContext>().AddSignInManager().AddDefaultTokenProviders();
        services.AddScoped<IUserClaimsPrincipalFactory<CinemaUser>, CinemaClaimsFactory>();
        services.Configure<DataProtectionTokenProviderOptions>(options => options.TokenLifespan = TimeSpan.FromHours(1));
        services.AddScoped<AccountEmailSender>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IMyBookingsService, MyBookingsService>();
        return services;
    }
}
