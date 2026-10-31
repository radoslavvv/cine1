using CinemaR.Application.Booking.Services;
using CinemaR.Application.Identity.Results;
using CinemaR.Application.Identity.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using CinemaR.Api.Requests;

namespace CinemaR.Api.Controllers;

[ApiController]
[Route("api/account")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AccountsController(IAccountService accounts, IMyBookingsService bookings) : ControllerBase
{
    [HttpGet("session")]
    public async Task<IActionResult> Session([FromServices] IAntiforgery antiforgery)
    {
        var token = antiforgery.GetAndStoreTokens(HttpContext).RequestToken;
        return Ok(new { customer = await accounts.CurrentAsync(), csrfToken = token });
    }

    [HttpPost("register"), EnableRateLimiting("account")]
    public async Task<IActionResult> Register(AccountCredentialsRequest request) => Result(await accounts.RegisterAsync(request.Email, request.Password));

    [HttpPost("sign-in"), EnableRateLimiting("account")]
    public async Task<IActionResult> SignIn(AccountCredentialsRequest request) => Result(await accounts.SignInAsync(request.Email, request.Password));

    [HttpPost("sign-out")]
    public async Task<IActionResult> EndSession()
    {
        await accounts.SignOutAsync();
        return Ok(new { message = "Signed out." });
    }

    [HttpPost("verify-email"), EnableRateLimiting("account")]
    public async Task<IActionResult> Verify(VerifyEmailRequest request) => Result(await accounts.ConfirmEmailAsync(request.UserId, request.Token));

    [HttpPost("resend-verification"), EnableRateLimiting("account")]
    public async Task<IActionResult> Resend(AccountEmailRequest request)
    {
        await accounts.ResendVerificationAsync(request.Email);
        return Ok(new { message = "If this account needs verification, a new link has been sent." });
    }

    [HttpPost("forgot-password"), EnableRateLimiting("account")]
    public async Task<IActionResult> Forgot(AccountEmailRequest request)
    {
        await accounts.ForgotPasswordAsync(request.Email);
        return Ok(new { message = "If a verified account exists, a password reset link has been sent." });
    }

    [HttpPost("reset-password"), EnableRateLimiting("account")]
    public async Task<IActionResult> Reset(ResetPasswordRequest request) => Result(await accounts.ResetPasswordAsync(request.Email, request.Token, request.Password));

    [Authorize, HttpGet("bookings")]
    public async Task<IActionResult> Bookings([FromQuery, Range(1, 100000)] int page = 1, CancellationToken cancellationToken = default)
    {
        var customer = await accounts.CurrentAsync();
        return customer is null ? Unauthorized() : Ok(await bookings.FindAsync(customer.Id, page, cancellationToken));
    }

    private IActionResult Result(AccountResult result) => result.Succeeded ? Ok(new { message = result.Message })
        : Problem(statusCode: result.InvalidCredentials ? 401 : 400, title: result.Message);
}
