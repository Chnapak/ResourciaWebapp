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
    public DbSet<ResourceFilterValues> ResourceFilterValues { get; set; }
    public DbSet<Resource> Resources { get; set; }
    public DbSet<ResourceReview> ResourceReviews { get; set; }
    public DbSet<ReviewVotes> ReviewsVotes { get; set; }
    public DbSet<Discussions> Discussions { get; set; }
    public DbSet<DiscussionReplies> DiscussionReplies { get; set; }
    public DbSet<ResourceRatings> ResourceRatings { get; set; }
    public DbSet<SavedResource> SavedResources { get; set; }
    public DbSet<ResourceImage> ResourceImages { get; set; } = null!;
    public DbSet<ResourceAuditEntry> ResourceAuditEntries { get; set; } = null!;
    public DbSet<BetaInvite> BetaInvites { get; set; } = null!;

    public AppDbContext(DbContextOptions options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Ignore<IdentityUserRole<Guid>>();
        modelBuilder.Ignore<IdentityRole<Guid>>();
        modelBuilder.Ignore<IdentityUserToken<Guid>>();
        modelBuilder.Ignore<IdentityRoleClaim<Guid>>();

        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>()
        .HasQueryFilter(u => u.DeletedAt == null);

        modelBuilder.Entity<Resource>()
        .HasQueryFilter(resource => resource.DeletedAtUtc == null);

        modelBuilder.Entity<FilterDefinitions>()
        .Property(x => x.SortOrder)
        .HasPrecision(18, 9);

        modelBuilder.Entity<ResourceFilterValues>()
        .HasOne(x => x.Resource)
        .WithMany(r => r.ResourceFilterValues)
        .HasForeignKey(x => x.ResourceId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResourceFilterValues>()
        .HasOne(x => x.FilterDefinitions)
        .WithMany(filter => filter.ResourceFilterValues)
        .HasForeignKey(x => x.FilterDefinitionsId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResourceFilterValues>()
        .HasOne(x => x.FacetValues)
        .WithMany(facetValue => facetValue.ResourceFilterValues)
        .HasForeignKey(x => x.FacetValuesId)
        .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ReviewVotes>()
            .HasKey(rv => new { rv.ReviewId, rv.UserId });

        modelBuilder.Entity<ResourceReview>()
            .HasOne(r => r.Resource)
            .WithMany(r => r.ResourceReviews)
            .HasForeignKey(r => r.ResourceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Discussions>()
            .HasOne(t => t.Resource)
            .WithMany(r => r.Discussions)
            .HasForeignKey(t => t.ResourceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DiscussionReplies>()
            .HasOne(r => r.Discussions)
            .WithMany(t => t.Replies)
            .HasForeignKey(r => r.DiscussionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SavedResource>()
            .HasKey(savedResource => new { savedResource.UserId, savedResource.ResourceId });

        modelBuilder.Entity<SavedResource>()
            .HasOne(savedResource => savedResource.User)
            .WithMany(user => user.SavedResources)
            .HasForeignKey(savedResource => savedResource.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SavedResource>()
            .HasOne(savedResource => savedResource.Resource)
            .WithMany(resource => resource.SavedResources)
            .HasForeignKey(savedResource => savedResource.ResourceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SavedResource>()
            .HasIndex(savedResource => savedResource.ResourceId);

        modelBuilder.Entity<ResourceRatings>()
        .HasKey(r => r.ResourceId);

        modelBuilder.Entity<ResourceRatings>()
            .HasOne(r => r.Resource)
            .WithOne()
            .HasForeignKey<ResourceRatings>(r => r.ResourceId);

        modelBuilder.Entity<Resource>()
        .HasOne(r => r.Ratings)
        .WithOne(rr => rr.Resource)
        .HasForeignKey<ResourceRatings>(rr => rr.ResourceId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResourceAuditEntry>()
            .HasOne(entry => entry.Resource)
            .WithMany()
            .HasForeignKey(entry => entry.ResourceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResourceAuditEntry>()
            .HasIndex(entry => entry.ResourceId);

        modelBuilder.Entity<ResourceAuditEntry>()
            .HasIndex(entry => entry.CreatedAtUtc);

        modelBuilder.Entity<ResourceAuditEntry>()
            .HasIndex(entry => new { entry.ResourceId, entry.CreatedAtUtc });

        modelBuilder.Entity<BetaInvite>()
            .HasIndex(invite => invite.NormalizedEmail);

        modelBuilder.Entity<BetaInvite>()
            .HasIndex(invite => invite.NormalizedEmail)
            .HasDatabaseName("IX_BetaInvites_NormalizedEmail_Pending")
            .IsUnique()
            .HasFilter("\"UsedAtUtc\" IS NULL AND \"RevokedAtUtc\" IS NULL");

    }
}
