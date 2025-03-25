using Microsoft.AspNetCore.Mvc;
using Resourcia.Data;


namespace Resourcia.Api.Controllers.Auth;

[ApiController]
[Route("[controller]")]
public class AuthController(AppDbContext dbContext) : ControllerBase
{
    private AppDbContext _dbContext = dbContext;

    // TODO: Implement the register/login endpoint
    [HttpPost(Name = "Login")]
    public async Task<ActionResult> Login()
    {
        throw new NotImplementedException();
    }
}
