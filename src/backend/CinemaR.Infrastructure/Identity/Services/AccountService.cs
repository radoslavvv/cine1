using CinemaR.Application.Identity.Responses;
using CinemaR.Application.Identity.Results;
using CinemaR.Application.Identity.Services;
using CinemaR.Infrastructure.Identity.Entities;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;

namespace CinemaR.Infrastructure.Identity.Services;

public sealed class AccountService(UserManager<CinemaRUser> users, SignInManager<CinemaRUser> signIn,
    IHttpContextAccessor http, AccountEmailSender emails, IConfiguration configuration) : IAccountService
{
    public async Task<CustomerSessionResponse?> CurrentAsync()
    {
        if (http.HttpContext?.User.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var user = await users.GetUserAsync(http.HttpContext.User);

        return user is { EmailConfirmed: true } ? new(user.Id, user.Email!, user.IsAdministrator) : null;
    }

    public async Task<AccountResult> RegisterAsync(string email, string password)
    {
        var user = new CinemaRUser { UserName = email.Trim(), Email = email.Trim() };
        var result = await users.CreateAsync(user, password);

        if (!result.Succeeded)
        {
            if (result.Errors.All(error => error.Code is "DuplicateUserName" or "DuplicateEmail"))
            {
                return new(true, "Check your inbox to verify your email. If you already have an account, sign in or reset your password.");
            }

            return Failure(result);
        }

        await SendVerificationAsync(user);

        return new(true, "Check your inbox to verify your email. If you already have an account, sign in or reset your password.");
    }

    public async Task<AccountResult> SignInAsync(string email, string password)
    {
        var result = await signIn.PasswordSignInAsync(email.Trim(), password, isPersistent: false, lockoutOnFailure: true);

        // Do not disclose whether an account exists, is unverified, or is locked out.
        return result.Succeeded ? new(true, "Signed in.")
            : new(false, "Unable to sign in. Check your credentials and verify your email, or try again later.", InvalidCredentials: true);
    }

    public Task SignOutAsync()
    {
        return signIn.SignOutAsync();
    }

    public async Task<AccountResult> ConfirmEmailAsync(string userId, string token)
    {
        var user = await users.FindByIdAsync(userId);
        var decoded = Decode(token);

        if (user is null || decoded is null)
        {
            return InvalidLink();
        }

        var result = await users.ConfirmEmailAsync(user, decoded);

        return result.Succeeded ? new(true, "Email verified. You can now sign in.") : InvalidLink();
    }

    public async Task ResendVerificationAsync(string email)
    {
        var user = await users.FindByEmailAsync(email.Trim());

        if (user is { EmailConfirmed: false })
        {
            await SendVerificationAsync(user);
        }
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await users.FindByEmailAsync(email.Trim());

        if (user is not { EmailConfirmed: true })
        {
            return;
        }

        var token = Encode(await users.GeneratePasswordResetTokenAsync(user));
        var link = Link("reset-password", new()
        {
            ["email"] = user.Email,
            ["token"] = token
        });

        await emails.SendAsync(user.Email!, "Reset your cinemaR password", $"Choose a new password using this link:\n{link}\n\nThis link expires in one hour. If you did not request it, ignore this message.");
    }

    public async Task<AccountResult> ResetPasswordAsync(string email, string token, string password)
    {
        var user = await users.FindByEmailAsync(email.Trim());
        var decoded = Decode(token);

        if (user is not { EmailConfirmed: true } || decoded is null)
        {
            return InvalidLink();
        }

        var result = await users.ResetPasswordAsync(user, decoded, password);

        if (!result.Succeeded)
        {
            return Failure(result);
        }

        await users.SetLockoutEndDateAsync(user, null);
        await users.ResetAccessFailedCountAsync(user);

        return new(true, "Password reset. Sign in with your new password.");
    }

    internal async Task SendVerificationAsync(CinemaRUser user)
    {
        var token = Encode(await users.GenerateEmailConfirmationTokenAsync(user));
        var link = Link("verify-email", new()
        {
            ["userId"] = user.Id,
            ["token"] = token
        });

        await emails.SendAsync(user.Email!, "Verify your cinemaR email", $"Verify your email before signing in:\n{link}\n\nThis link expires in one hour. If you did not create this account, ignore this message.");
    }

    private string Link(string path, Dictionary<string, string?> query)
    {
        var origin = configuration["Identity:FrontendOrigin"] ?? throw new InvalidOperationException("Configure Identity:FrontendOrigin for account email links.");

        // Never construct security-sensitive links from the incoming Host header.
        return QueryHelpers.AddQueryString($"{origin.TrimEnd('/')}/account/{path}", query);
    }

    private static string Encode(string token)
    {
        return WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
    }

    private static string? Decode(string token)
    {
        try
        {
            return Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
        }
        catch (FormatException) { return null; }
    }

    private static AccountResult InvalidLink()
    {
        return new(false, "This link is invalid or expired. Request a new one.");
    }

    private static AccountResult Failure(IdentityResult result)
    {
        return new(false, string.Join(" ", result.Errors.Select(error => error.Description)));
    }
}
