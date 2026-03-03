namespace Resourcia.Api.Models.Admin;

public class FractionalIndexingModel
{
    public Guid movedId { get; set; }
    public Guid? aboveId { get; set; }
    public Guid? belowId { get; set; }
}
