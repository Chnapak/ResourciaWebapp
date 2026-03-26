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

<<<<<<< HEAD
    public DbSet<ResourceReview> ResourceReviews { get; set; }
    public DbSet<ReviewVotes> ReviewsVotes { get; set; }
    public DbSet<Discussions> Discussions { get; set; }
    public DbSet<DiscussionReplies> DiscussionReplies { get; set; }
    public DbSet<ResourceRatings> ResourceRatings { get; set; }

=======
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
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

        modelBuilder.Entity<AppUser>()
        .HasQueryFilter(u => u.DeletedAt == null);

        modelBuilder.Entity<FilterDefinitions>()
        .Property(x => x.SortOrder)
        .HasPrecision(18, 9);

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
<<<<<<< HEAD

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

        modelBuilder.Entity<ResourceRatings>()
        .HasKey(r => r.ResourceId);

        modelBuilder.Entity<ResourceRatings>()
            .HasOne(r => r.Resource)
            .WithOne()
            .HasForeignKey<ResourceRatings>(r => r.ResourceId);
    }
}
