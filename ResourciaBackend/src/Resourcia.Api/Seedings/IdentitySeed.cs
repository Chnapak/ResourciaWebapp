using Microsoft.AspNetCore.Identity;
using Resourcia.Data.Entities.Identity;

namespace Resourcia.Api.Seedings;

public class IdentitySeed
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var _userManager = services.GetRequiredService<UserManager<AppUser>>();
        var _roleManager = services.GetRequiredService<RoleManager<AppRole>>();
        var _ownerDetails = services.GetRequiredService<IConfiguration>().GetSection("OwnerDetailsSettings");
        var _clock = services.GetRequiredService<NodaTime.IClock>();

        var roles = new[] { "Owner", "Admin", "User" };
        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new AppRole
                {
                    Id = Guid.NewGuid(),
                    Name = role,
                    NormalizedName = role.ToUpper()
                });
            }
        }

        var adminEmail = _ownerDetails.GetValue<string>("Email");
        var adminUser = await _userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            var adminUsername = _ownerDetails.GetValue<string>("Username");
            var adminPassword = _ownerDetails.GetValue<string>("Password");

            var now = _clock.GetCurrentInstant();

            adminUser = new AppUser
            {
                Id = Guid.NewGuid(),
                DisplayName = adminUsername,
                Email = adminEmail,
                EmailConfirmed = true,
                UserName = adminEmail,
                CreatedAt = now,
                CreatedBy = "System",
                ModifiedAt = now,
                ModifiedBy = "System"
            };

            var result = await _userManager.CreateAsync(adminUser, adminPassword);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(adminUser, "Owner");
                await _userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }


    }

}
