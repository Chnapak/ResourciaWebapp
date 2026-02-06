using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;

public class ResourceFacetValues
{
    public Guid ResourceId { get; set; }
    public Resource Resource { get; set; } = null!;

    public Guid FacetValuesId { get; set; }
    public FacetValues FacetValues { get; set; } = null!;

}
