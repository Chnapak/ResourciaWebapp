﻿using Microsoft.AspNetCore.Identity;
using NodaTime;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Resourcia.Data.Interfaces;

namespace Resourcia.Data.Entities;

public class Resource
{
    public required Guid Id { get; set; }
    public required string Name { get; set; } = null!;
    public required string Url { get; set; } = null!;
    public required int AvailabilityTag { get; set; }
    public string Description { get; set; } = null!;
}
