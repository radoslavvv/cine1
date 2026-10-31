using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace CinemaR.Infrastructure.Identity.Services;

public sealed class AccountEmailSender(IConfiguration configuration, IHostEnvironment environment)
{
    public async Task SendAsync(string email, string subject, string message)
    {
        var host = configuration["Email:SmtpHost"];

        if (string.IsNullOrWhiteSpace(host))
        {
            throw new InvalidOperationException("Configure Email:SmtpHost before sending account email.");
        }

        using var client = new SmtpClient(host, configuration.GetValue("Email:SmtpPort", 1025))
        {
            EnableSsl = !environment.IsDevelopment(),
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 10000
        };

        if (configuration["Email:Username"] is { Length: > 0 } username)
        {
            client.Credentials = new System.Net.NetworkCredential(username, configuration["Email:Password"]);
        }

        using var mail = new MailMessage(configuration["Email:From"] ?? "accounts@cinemar.local", email, subject, message);

        await client.SendMailAsync(mail);
    }
}
