using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ResourciaApi.Data.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ResourciaApi.Data.Entities;

namespace ResourciaApi.Data
{
    public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<AppUser> Users { get; set; }

        public DbSet<EmailMessage> Emails { get; set; }
    }
}
