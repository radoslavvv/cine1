using CinemaR.Application.Identity.Responses;
using CinemaR.Application.Identity.Results;
namespace CinemaR.Application.Identity.Services;

public interface IAccountService
{
    Task<CustomerSessionResponse?> CurrentAsync();

    Task<AccountResult> RegisterAsync(string email, string password);

    Task<AccountResult> SignInAsync(string email, string password);

    Task SignOutAsync();

    Task<AccountResult> ConfirmEmailAsync(string userId, string token);

    Task ResendVerificationAsync(string email);

    Task ForgotPasswordAsync(string email);

    Task<AccountResult> ResetPasswordAsync(string email, string token, string password);
}
