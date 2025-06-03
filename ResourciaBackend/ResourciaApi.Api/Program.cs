using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System;
using System.Text;
using Microsoft.AspNetCore.Builder.Extensions;
using NodaTime;
using Microsoft.OpenApi.Models;
using Resourcia.Api.Utils;
using Resourcia.Api.Services;
using Resourcia.Api.BackgroundWorkers;
using Resourcia.Api.Options;
using Resourcia.Data;
using Resourcia.Data.Entities.Identity;
using Resourcia.Api.Services.Interfaces;

namespace Resourcia.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

        builder.Services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(connectionString, builder =>
            {
                builder.UseNodaTime();
            });
        });

        builder.Services.AddIdentityCore<AppUser>(options => options.SignIn.RequireConfirmedAccount = true).AddEntityFrameworkStores<AppDbContext>().AddSignInManager().AddDefaultTokenProviders();

        builder.Services.Configure<IdentityOptions>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequireUppercase = true;
            options.Password.RequiredLength = 6;
            options.Password.RequiredUniqueChars = 1;
        });

        builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(nameof(JwtSettings)));
        var jwtSettings = builder.Configuration.GetRequiredSection(nameof(JwtSettings)).Get<JwtSettings>();

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience
            };
        });
        // Add services to the container.
        builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("SmtpSettings"));
        builder.Services.Configure<EnvironmentOptions>(builder.Configuration.GetSection("EnvironmentSettings"));

        // Add services to the container.

        builder.Services.AddScoped<IDeweyService, DeweyService>();
        builder.Services.AddSingleton<IClock>(SystemClock.Instance);
        builder.Services.AddScoped<IApplicationMapper, ApplicationMapper>();
        builder.Services.AddScoped<EmailSenderService>();

        // You can also use the following code to register the EnvironmentOptions class if you have using IOptions<EnvironmentOptions> envSettings in the AuthController.
        //builder.Services.AddScoped<EnvironmentOptions, EnvironmentOptions>();

        builder.Services.AddHostedService<EmailSenderBackgroundService>();

        builder.Services.AddControllers();

        builder.Services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo { Title = "JWT API", Version = "v1" });

            // Configure JWT Authentication in Swagger
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter your JWT token without the 'Bearer' prefix.\n\nExample: abc123xyz"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });


        // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
        builder.Services.AddOpenApi();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();

        app.Run();
    }
}