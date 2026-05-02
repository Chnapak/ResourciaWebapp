# Changes

## 2026-05-02 - v0.3.0

### Features
- Beta invite system for gated early access.
- External OAuth (Google/Facebook): full flow, error handling, and frontend URL redirects.
- Resource audit feature update.
- AI usage stats shown in the homepage search bar.
- Search engine indexing via `robots.txt` and `sitemap.xml`.
- Caddy reverse proxy deployment with www→apex domain redirect.

### Fixes
- Boolean `false` filter values now evaluated correctly.
- API uploads and auth keys persisted correctly across container restarts.
- Email resend made idempotent; delivery reliability fixed.
- VPS CD pipeline: password integration, compose override prevention, domain connectivity.
- Mobile responsiveness improvements.

### Other
- Site favicon updated.
- Deploy and test suite stabilised.

---

## 2026-04-21 - Frontend/build/test cleanup pass

### What was fixed

1. Frontend Playwright lint/type issue
   - Updated `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\tests\e2e\home.spec.ts`
   - Removed the implicit `any` problem on the mocked route handler by giving the route callback an explicit structural type.
   - Kept the test behavior the same: the home page still mocks `/api/Search/Schema` and verifies the app loads.

2. Frontend production CSS budget blocker
   - Updated `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\app\features\profile\pages\edit-profile-page\edit-profile-page.component.scss`
   - Updated `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\styles\edit-profile.shared.scss`
   - Moved the reusable `ep-*` card/form/button/tag styles out of the page-local stylesheet and into the shared global profile stylesheet.
   - This reduced the size of the edit-profile page component stylesheet enough for the production Angular build to complete again.

3. Backend unit test compile errors in resource audit tests
   - Updated `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api.UnitTests\ResourceAuditTests.cs`
   - Updated `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api.UnitTests\Resourcia.Api.UnitTests.csproj`
   - Added the missing framework/usings needed by the test file.
   - Added `Microsoft.EntityFrameworkCore.InMemory` to the test project so `UseInMemoryDatabase(...)` resolves correctly.
   - Fixed `MemoryDistributedCache` construction to use `Microsoft.Extensions.Options.Options.Create(...)`.
   - Suppressed EF Core's in-memory transaction warning in the test DbContext builder, because the controller under test starts transactions and EF's in-memory provider does not support them.

4. Backend adjacent test cleanup found during verification
   - Updated `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api.UnitTests\CaptchaServiceTests.cs`
   - The success test was returning an empty `200 OK`, but `CaptchaService` now expects a JSON response payload.
   - Changed the stubbed response body to `{"success":true}` so the test matches the current service contract.

5. Test project quality-of-life cleanup
   - Updated `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api.UnitTests\Resourcia.Api.UnitTests.csproj`
   - Enabled `ImplicitUsings` and `Nullable`.
   - Disabled `NuGetAudit` for this test project to avoid local/offline build failures caused by vulnerability-audit endpoint issues unrelated to the code under test.

6. Server compose alignment
   - Updated `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\docker-compose.yml`
   - Switched the frontend Docker build argument from `development` to `production` so VPS deployments build the production Angular bundle.
   - Pinned PostgreSQL from `postgres:latest` to `postgres:17` to avoid the v18 data-directory incompatibility that broke the server database container earlier.

### Verification notes

- Frontend lint passed locally.
- Frontend production build completed locally after the stylesheet refactor.
- Backend unit test issues were reduced from compile-time failures to runtime test issues, and the follow-up fixes were applied.
- Final backend success was confirmed from the local rerun after the last fixes.

### Files changed

- `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\tests\e2e\home.spec.ts`
- `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\app\features\profile\pages\edit-profile-page\edit-profile-page.component.scss`
- `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\styles\edit-profile.shared.scss`
- `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api.UnitTests\ResourceAuditTests.cs`
- `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api.UnitTests\CaptchaServiceTests.cs`
- `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api.UnitTests\Resourcia.Api.UnitTests.csproj`
- `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\docker-compose.yml`
