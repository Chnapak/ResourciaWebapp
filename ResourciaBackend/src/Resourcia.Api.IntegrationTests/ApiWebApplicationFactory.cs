using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Resourcia.Api.BackgroundWorkers;
using Resourcia.Data;

namespace Resourcia.Api.IntegrationTests;

public class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            var settings = new Dictionary<string, string>
            {
                ["JwtSettings:SecretKey"] = "test-secret-key-should-be-long-enough",
                ["JwtSettings:Issuer"] = "resourcia-test",
                ["JwtSettings:Audience"] = "resourcia-test",
                ["JwtSettings:AccessTokenExpirationInMinutes"] = "60",
                ["JwtSettings:RefreshTokenExpirationInDays"] = "7",
                ["Redis:ConnectionString"] = "localhost:6379"
            };

            config.AddInMemoryCollection(settings);
        });

        builder.ConfigureServices(services =>
        {
            var hostedService = services.SingleOrDefault(descriptor =>
                descriptor.ImplementationType == typeof(EmailSenderBackgroundService));

            if (hostedService != null)
            {
                services.Remove(hostedService);
            }

            var providerDescriptors = services
                .Where(descriptor =>
                    (descriptor.ServiceType.FullName?.Contains("IDatabaseProvider", StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (descriptor.ServiceType.FullName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (descriptor.ImplementationType?.FullName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) ?? false))
                .ToList();

            foreach (var descriptor in providerDescriptors)
            {
                services.Remove(descriptor);
            }

            var dbContextOptionDescriptors = services
                .Where(descriptor =>
                    descriptor.ServiceType.FullName?.Contains("DbContextOptions", StringComparison.OrdinalIgnoreCase) == true ||
                    descriptor.ServiceType.FullName?.Contains("IDbContextOptionsConfiguration", StringComparison.OrdinalIgnoreCase) == true ||
                    descriptor.ServiceType.FullName?.Contains("DbContextFactory", StringComparison.OrdinalIgnoreCase) == true)
                .ToList();

            foreach (var descriptor in dbContextOptionDescriptors)
            {
                services.Remove(descriptor);
            }

            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("resourcia-test"));

            using var serviceProvider = services.BuildServiceProvider();
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }
}
