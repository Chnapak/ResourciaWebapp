using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NodaTime;
using Resourcia.Api.BackgroundWorkers;
using Resourcia.Api.Options;
using Resourcia.Api.Seedings;
using Resourcia.Api.Services;
using Resourcia.Api.Utils;
using Resourcia.Data;
using Resourcia.Data.Entities;
using Resourcia.Data.Entities.Identity;
using System.Text;

namespace Resourcia.Api;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

        builder.WebHost.ConfigureKestrel(options =>
        {
            // Keep connections alive so the browser can reuse them
            options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);

            // Required so keep-alive actually works properly
            options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
        });

        builder.Services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(connectionString, builder =>
            {
                builder.UseNodaTime();
            });
        });

        builder.Services.AddIdentityCore<AppUser>(options =>
            options.SignIn.RequireConfirmedAccount = true
            )
            .AddRoles<AppRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

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
        builder.Services.Configure<OAuthOptions>(builder.Configuration.GetSection(nameof(OAuthOptions)));

        var jwtSettings = builder.Configuration.GetRequiredSection(nameof(JwtSettings)).Get<JwtSettings>();
        var oauthSettings = builder.Configuration.GetSection(nameof(OAuthOptions)).Get<OAuthOptions>();

        builder.Services.AddAuthentication(options =>
        {
            options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddCookie(IdentityConstants.ExternalScheme)
        .AddCookie(IdentityConstants.ApplicationScheme)
        .AddJwtBearer(options =>
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
        })
        .AddGoogle(options =>
        {
            options.ClientId = oauthSettings?.Google?.ClientId ?? "invalid";
            options.ClientSecret = oauthSettings?.Google?.ClientSecret ?? "invalid";
            options.SaveTokens = false;
        })
        .AddFacebook(options =>
        {
            options.AppId = oauthSettings?.Facebook?.AppId ?? "invalid";
            options.AppSecret = oauthSettings?.Facebook?.AppSecret ?? "invalid";
            options.SaveTokens = false;
        });

        builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("SmtpSettings"));
        builder.Services.Configure<EnvironmentOptions>(builder.Configuration.GetSection("EnvironmentSettings"));
        builder.Services.Configure<CloudflareOptions>(builder.Configuration.GetSection("CloudflareSettings"));
        builder.Services.Configure<OwnerDetailsOptions>(builder.Configuration.GetSection("OwnerDetailsSettings"));
        builder.Services.Configure<RedisOptions>(builder.Configuration.GetSection("Redis"));

        // Add services to the container.
        builder.Services.AddSingleton<IClock>(SystemClock.Instance);
        builder.Services.AddScoped<IApplicationMapper, ApplicationMapper>();
        builder.Services.AddScoped<EmailSenderService>();
        builder.Services.AddScoped<ImageService>(sp =>
        {
            var imagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            return new ImageService(imagePath);
        });
        builder.Services.AddHttpClient<CaptchaService>();
        builder.Services.AddScoped<ProfileService>();
        builder.Services.AddScoped<ReviewService>();
        builder.Services.AddScoped<OAuthService>();

        builder.Services.AddStackExchangeRedisCache(options =>
        {
            var redisOptions = builder.Configuration.GetSection("Redis").Get<RedisOptions>()!;
            options.Configuration = redisOptions.ConnectionString;
            options.InstanceName = "resourcia:";
        });
        builder.Services.AddScoped<CacheService>(); // 👈 and here



        builder.Services.AddHostedService<EmailSenderBackgroundService>();

        builder.Services.AddControllers().AddNewtonsoftJson(options =>
        {
            options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
            options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter(
                camelCaseText: true
            ));
        });

        builder.Services.AddHealthChecks();

        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        builder.Services.AddEndpointsApiExplorer();
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

        var app = builder.Build();

        using var scope = app.Services.CreateScope();

        if (app.Environment.IsDevelopment())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // optional: ensures DB is up to date in dev

            await db.Database.MigrateAsync();

            // Seed only if missing
            if (!await db.Filters.AnyAsync(f => f.Key == "subject"))
            {
                var now = SystemClock.Instance.GetCurrentInstant();

                db.Filters.Add(new FilterDefinitions
                {
                    Key = "subject",
                    Label = "Subject",
                    Description = "Topics for resources",
                    // include these only if your table has them:
                    Kind = FilterKind.Facet,
                    IsMulti = true,
                    IsActive = true,
                    SortOrder = 1,
                    FacetValues = new List<FacetValues>
                    {
                        new FacetValues { Value = "math", Label = "Math", IsActive = true, SortOrder = 1 },
                        new FacetValues { Value = "science", Label = "Science", IsActive = true, SortOrder = 2 },
                        new FacetValues { Value = "english", Label = "English", IsActive = true, SortOrder = 3 },
                        new FacetValues { Value = "history", Label = "History", IsActive = true, SortOrder = 4 },
                    },
                    CreatedAt = now,
                    CreatedBy = "system"

                });

                // STRING (free-text input) - no FacetValues
                db.Filters.Add(new FilterDefinitions
                {
                    Key = "author",
                    Label = "Author",
                    Description = "Filter by author name",
                    Kind = FilterKind.Text,   // use your enum value (Text/String)
                    IsMulti = false,
                    IsActive = true,
                    SortOrder = 2,
                    ResourceField = "Author",
                    CreatedAt = now,
                    CreatedBy = "system"
                });

                // BOOL (toggle) - no FacetValues
                db.Filters.Add(new FilterDefinitions
                {
                    Key = "isFree",
                    Label = "Free only",
                    Description = "Show only free resources",
                    Kind = FilterKind.Boolean,  // use your enum value (Boolean/Bool)
                    IsMulti = false,
                    IsActive = true,
                    SortOrder = 3,
                    ResourceField = "IsFree",
                    CreatedAt = now,
                    CreatedBy = "system"
                });

                // NUMBER (range input) - no FacetValues
                db.Filters.Add(new FilterDefinitions
                {
                    Key = "year",
                    Label = "Year",
                    Description = "Filter by publication year",
                    Kind = FilterKind.Range, // use your enum value (Number/Range)
                    IsMulti = false,
                    IsActive = true,
                    SortOrder = -1,
                    ResourceField = "Year",
                    CreatedAt = now,
                    CreatedBy = "system"
                });

                await db.SaveChangesAsync();



                await db.SaveChangesAsync();
            }
        }

        await IdentitySeed.SeedAsync(scope.ServiceProvider);

        var uploadsPath = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsPath);

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseStaticFiles();

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(uploadsPath),
            RequestPath = "/uploads",
            ContentTypeProvider = new FileExtensionContentTypeProvider()
            {
                Mappings =
        {
            [".png"] = "image/png",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".gif"] = "image/gif"
        }
            }
        });


        //app.UseHttpsRedirection();

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapHealthChecks("/healthz");

        app.MapControllers();

        app.Run();
    }
}
