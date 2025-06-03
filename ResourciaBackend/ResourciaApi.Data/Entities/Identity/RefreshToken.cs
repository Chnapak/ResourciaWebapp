using NodaTime;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities.Identity
{
    internal class RefreshToken
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public required string Token { get; set; }
        public Instant CreatedAt { get; set; }
        public Instant ExpiresAt { get; set; }
    }
}
