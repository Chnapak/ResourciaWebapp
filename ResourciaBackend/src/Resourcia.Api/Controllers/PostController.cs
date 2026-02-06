using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Api.Models.Posts;
using Resourcia.Api.Utils;
using Resourcia.Data;
using Resourcia.Data.Entities;
using Resourcia.Data.Interfaces;

namespace Resourcia.Api.Controllers;

[ApiController]
public class PostController(IClock clock, IApplicationMapper mapper, AppDbContext dbContext) : ControllerBase
{
    private AppDbContext _dbContext = dbContext;
    private IClock _clock = clock;
    private IApplicationMapper _mapper = mapper;

    [Authorize]
    [HttpPost("api/Post")]
    public async Task<ActionResult<DetailPostModel>> Create([FromBody] CreatePostModel model)
    {
        var now = _clock.GetCurrentInstant();
        var newEntity = new Post
        {
            Id = Guid.NewGuid(),
            Content = model.Content,
            AuthorId = User.GetUserId(), 
        }.SetCreateBySystem(now);

        _dbContext.Add(newEntity);
        await _dbContext.SaveChangesAsync();

        newEntity = await _dbContext
            .Posts
            .Include(x => x.Author)
            .FirstAsync(x => x.Id == newEntity.Id);

        var url = Url.Action(nameof(Get), new { newEntity.Id })
            ?? throw new Exception();
        return Created(url, _mapper.ToDetail(newEntity));
    }

    [Authorize]
    [HttpPut("api/Post/{id:guid}")]
    public async Task<ActionResult<DetailPostModel>> Update([FromRoute] Guid id, [FromBody] CreatePostModel model)
    {
        var dbEntity = await _dbContext.Posts.FirstOrDefaultAsync(x => x.Id == id);
        if (dbEntity == null)
        {
            return NotFound();
        }

        dbEntity.Content = model.Content;
        dbEntity.SetModifyBy(User.GetName(), _clock.GetCurrentInstant());

        await _dbContext.SaveChangesAsync();

        dbEntity = await _dbContext.Posts.FirstAsync(x => x.Id == dbEntity.Id);
        return Ok(_mapper.ToDetail(dbEntity));
    }

    [HttpGet("api/Post/{id:guid}")]
    public async Task<ActionResult<DetailPostModel>> Get([FromRoute] Guid id)
    {
        var dbEntity = await _dbContext
            .Posts
            .Include(x => x.Author)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (dbEntity == null)
        {
            return NotFound();
        }

        return Ok(_mapper.ToDetail(dbEntity));
    }

    [HttpGet("api/Post")]
    public async Task<ActionResult<List<DetailPostModel>>> GetList()
    {
        var models = _dbContext
            .Posts
            .Include(x => x.Author)
            .Select(_mapper.ToDetail);

        return Ok(models);
    }

    [HttpDelete("api/Post/{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var dbEntity = await _dbContext.Posts.FirstOrDefaultAsync(x => x.Id == id);
        if (dbEntity == null)
        {
            return NotFound();
        }

        _dbContext.Remove(dbEntity);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
}
