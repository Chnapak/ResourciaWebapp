using Microsoft.Extensions.Options;
using Resourcia.Api.Options;
using Resourcia.Api.Services;

namespace Resourcia.Api.BackgroundWorkers;

public class EmailSenderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _provider;
    private readonly SmtpOptions _smtpOptions;
    private readonly ILogger<EmailSenderBackgroundService> _logger;

    public EmailSenderBackgroundService(
        IServiceProvider provider,
        IOptions<SmtpOptions> smtpOptions,
        ILogger<EmailSenderBackgroundService> logger)
    {
        _provider = provider;
        _smtpOptions = smtpOptions.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email sender background service started");
        await SendEmails(stoppingToken);
    }

    private async Task SendEmails(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _provider.CreateScope();
                var emailSenderService = scope.ServiceProvider.GetRequiredService<EmailSenderService>();
                await emailSenderService.SendEmailsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in email sender tick");
            }

            await Task.Delay(TimeSpan.FromSeconds(120), stoppingToken);
        }
    }
}
