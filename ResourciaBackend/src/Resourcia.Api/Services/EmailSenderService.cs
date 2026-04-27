using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MailKit.Security;
using MimeKit;
using NodaTime;
using Resourcia.Api.Options;
using System.Net.Mail;
using Resourcia.Data;
using Resourcia.Data.Entities;
using Resourcia.Data.Interfaces;

namespace Resourcia.Api.Services;

public class EmailSenderService
{
    private readonly AppDbContext _dbContext;
    private readonly SmtpOptions _smtpOptions;
    private readonly EnvironmentOptions _envOptions;
    private readonly IClock _clock;
    private readonly ILogger<EmailSenderService> _logger;

    public EmailSenderService(
        IClock clock,
        AppDbContext appDbContext,
        IOptions<EnvironmentOptions> envOptions,
        IOptions<SmtpOptions> options,
        ILogger<EmailSenderService> logger)
    {
        _dbContext = appDbContext;
        _smtpOptions = options.Value;
        _envOptions = envOptions.Value;
        _clock = clock;
        _logger = logger;
    }

    public async Task AddEmail(string subject, string body, string recipientEmail, string? recipientName = null, string? fromEmail = null, string? fromName = null)
    {
        var message = new EmailMessage
        {
            Subject = subject,
            Body = body,
            RecipientEmail = recipientEmail,
            RecipientName = recipientName,
            FromEmail = fromEmail ?? _envOptions.SenderEmail,
            FromName = fromName ?? _envOptions.SenderName,
            Sent = false,
            CreatedAt = _clock.GetCurrentInstant(),
        };

        _dbContext.Add(message);
        await _dbContext.SaveChangesAsync();
    }

    public async Task SendEmailsAsync()
    {
        var unsentMails = await _dbContext.Emails.Where(x => !x.Sent).ToListAsync();
        foreach (var unsent in unsentMails)
        {
            try
            {
                using var mail = new MailMessage
                {
                    Subject = unsent.Subject,
                    Body = unsent.Body,
                    IsBodyHtml = true,
                    From = new MailAddress(unsent.FromEmail, unsent.FromName),
                };
                mail.To.Add(new MailAddress(unsent.RecipientEmail, unsent.RecipientName));

                using var smtp = new MailKit.Net.Smtp.SmtpClient();
                await smtp.ConnectAsync(_smtpOptions.Host, _smtpOptions.Port, SecureSocketOptions.StartTlsWhenAvailable);
                await smtp.AuthenticateAsync(_smtpOptions.Username, _smtpOptions.Password);
                await smtp.SendAsync((MimeMessage)mail);
                await smtp.DisconnectAsync(true);

                unsent.Sent = true;
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation("Sent email {EmailId} to {RecipientEmail}.", unsent.Id, unsent.RecipientEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send email {EmailId} to {RecipientEmail} using SMTP host {SmtpHost}:{SmtpPort} from {FromEmail}.",
                    unsent.Id,
                    unsent.RecipientEmail,
                    _smtpOptions.Host,
                    _smtpOptions.Port,
                    unsent.FromEmail);
            }
        }
    }
}
