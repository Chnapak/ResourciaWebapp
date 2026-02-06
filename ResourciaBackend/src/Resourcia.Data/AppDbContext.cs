using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Resourcia.Data.Entities;
using Resourcia.Data.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data;

public class AppDbContext : IdentityDbContext<AppUser, AppRole, Guid>
{
    public DbSet<Post> Posts { get; set; }

    public DbSet<Comment> Comments { get; set; }

    public DbSet<EmailMessage> Emails { get; set; }

    public DbSet<RefreshToken> RefreshTokens { get; set; }

    public DbSet<FilterDefinitions> Filters { get; set; }

    public DbSet<FacetValues> FacetValues { get; set; }

    public DbSet<ResourceFacetValues> ResourceFacetValues { get; set; }

    public DbSet<Resource> Resources { get; set; }

    public AppDbContext(DbContextOptions options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Ignore<IdentityUserRole<Guid>>();
        modelBuilder.Ignore<IdentityRole<Guid>>();
        modelBuilder.Ignore<IdentityUserLogin<Guid>>();
        modelBuilder.Ignore<IdentityUserToken<Guid>>();
        modelBuilder.Ignore<IdentityRoleClaim<Guid>>();

        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ResourceFacetValues>()
        .HasKey(x => new { x.ResourceId, x.FacetValuesId });

        modelBuilder.Entity<ResourceFacetValues>()
        .HasOne(x => x.Resource)
        .WithMany(r => r.ResourceFacetValues)
        .HasForeignKey(x => x.ResourceId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResourceFacetValues>()
        .HasOne(x => x.FacetValues)
        .WithMany(fv => fv.ResourceFacetValues)
        .HasForeignKey(x => x.FacetValuesId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResourceFacetValues>()
        .HasIndex(x => x.FacetValuesId);
    }
}
