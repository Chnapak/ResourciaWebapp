using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Resourcia.Data;

public class DesignTimeAppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=resourcia_design;Username=postgres;Password=postgres;SSL Mode=Disable",
            npgsql => npgsql.UseNodaTime());

        return new AppDbContext(optionsBuilder.Options);
    }
}
