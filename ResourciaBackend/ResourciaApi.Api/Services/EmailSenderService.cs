using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MimeKit;
using MailKit;
using NodaTime;
using System.Net.Mail;
using ResourciaApi.Api.Options;
using ResourciaApi.Data;
using ResourciaApi.Data.Entities;
using ResourciaApi.Data.Interfaces;

namespace ResourciaApi.Api.Services;

public class EmailSenderService
{
    private readonly AppDbContext _dbContext;
    private readonly SmtpOptions _smtpOptions;
    private readonly EnvironmentOptions _envOptions;
    private readonly IClock _clock;

    public EmailSenderService(IClock clock, AppDbContext appDbContext, IOptions<EnvironmentOptions> envOptions, IOptions<SmtpOptions> options)
    {
        _dbContext = appDbContext;
        _smtpOptions = options.Value;
        _envOptions = envOptions.Value;
        _clock = clock;
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
            using var mail = new MailMessage
            {
                Subject = unsent.Subject,
                Body = unsent.Body,
                IsBodyHtml = true,
                From = new MailAddress(unsent.FromEmail, unsent.FromName),
            };
            mail.To.Add(new MailAddress(unsent.RecipientEmail, unsent.RecipientName));

            try
            {
                using var smtp = new MailKit.Net.Smtp.SmtpClient();
                await smtp.ConnectAsync(_smtpOptions.Host, _smtpOptions.Port);
                await smtp.AuthenticateAsync(_smtpOptions.Username, _smtpOptions.Password);
                await smtp.SendAsync((MimeMessage)mail);

                unsent.Sent = true;
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
            }
        }
    }
}