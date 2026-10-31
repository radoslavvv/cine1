using Cinema.Application.Identity.Services;
using Cinema.Infrastructure.Identity.Entities;
using Cinema.Infrastructure.Identity.Services;
using Cinema.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Cinema.Infrastructure.Identity.Setup;

public static class AdministratorSetup
{
    public static async Task<int> RunAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaRDbContext>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<CinemaUser>>();
        await using var transaction = await db.Database.BeginTransactionAsync();
        // Serialize setup commands; the filtered unique index also enforces one administrator.
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(741903812)");
        if (await db.Users.AnyAsync(user => user.IsAdministrator))
        {
            Console.WriteLine("An administrator already exists. No account was changed. Use email verification resend or password recovery if needed.");
            return 0;
        }
        Console.Write("Administrator email: ");
        var email = Console.ReadLine()?.Trim();
        Console.Write("Password (12+ characters, uppercase, lowercase, number and symbol): ");
        var password = ReadPassword();
        if (password.Length > 128)
        {
            Console.Error.WriteLine("Passwords must contain at most 128 characters.");
            return 1;
        }
        if (string.IsNullOrWhiteSpace(email) || email.Length > 254 || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email))
        {
            Console.Error.WriteLine("A valid email address of at most 254 characters is required.");
            return 1;
        }
        var admin = new CinemaUser { UserName = email, Email = email, IsAdministrator = true };
        var result = await users.CreateAsync(admin, password);
        if (!result.Succeeded)
        {
            Console.Error.WriteLine(string.Join(" ", result.Errors.Select(error => error.Description)));
            return 1;
        }
        await transaction.CommitAsync();
        await ((AccountService)scope.ServiceProvider.GetRequiredService<Cinema.Application.Identity.Services.IAccountService>()).SendVerificationAsync(admin);
        Console.WriteLine("Administrator created. Open the verification email in the local inbox before signing in.");
        return 0;
    }

    private static string ReadPassword()
    {
        if (Console.IsInputRedirected) return Console.ReadLine() ?? "";
        var password = new System.Text.StringBuilder();
        while (true)
        {
            var key = Console.ReadKey(intercept: true);
            if (key.Key == ConsoleKey.Enter) { Console.WriteLine(); return password.ToString(); }
            if (key.Key == ConsoleKey.Backspace) { if (password.Length > 0) password.Length--; }
            else if (!char.IsControl(key.KeyChar)) password.Append(key.KeyChar);
        }
    }
}
