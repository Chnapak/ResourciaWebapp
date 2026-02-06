using Microsoft.Extensions.Options;
using Resourcia.Api.Options;
using Resourcia.Api.Services;

namespace Resourcia.Api.BackgroundWorkers;

public class EmailSenderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _provider;
    private readonly SmtpOptions _smtpOptions;

    public EmailSenderBackgroundService(
        IServiceProvider provider,
        IOptions<SmtpOptions> smtpOptions
        )
    {
        _provider = provider;
        _smtpOptions = smtpOptions.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await SendEmails(stoppingToken);
    }

    private async Task SendEmails(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _provider.CreateScope();
            var emailSenderService = scope.ServiceProvider.GetRequiredService<EmailSenderService>();
            await emailSenderService.SendEmailsAsync();

            await Task.Delay(TimeSpan.FromSeconds(120));
        }
    }
}
