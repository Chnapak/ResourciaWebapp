# Resourcia - Graduation Project

Resourcia is a full-stack web application for discovering, saving, and sharing learning resources. It is built as a school graduation project and includes a web app, an API, and a companion browser extension.

**Key Features**
1. Resource catalog with search, filters, and detail pages.
2. User accounts with JWT auth, email confirmation, and password reset.
3. OAuth login providers (Google/Facebook) and Cloudflare Turnstile captcha.
4. User profiles and saved resources.
5. Admin panel for managing filters, users, and resources.
6. Optional browser extension that augments Google Search results with Resourcia actions.

**Tech Stack**
1. Frontend: Angular 20, Tailwind CSS, standalone components.
2. Backend: ASP.NET Core, EF Core, Identity, JWT.
3. Data: PostgreSQL, Redis.
4. Infra: Docker Compose, Nginx (frontend container).

**Project Structure**
1. `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend` - Angular web app.
2. `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend` - ASP.NET Core API + data layer.
3. `C:\Users\matej\source\repos\ResourciaApi\ResourciaExtension` - Browser extension (Manifest v3).

**Quick Start (Docker, HTTPS)**
1. From `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src` run:
   ```
   docker compose up -d --build
   ```
2. Frontend: `https://localhost:4200`
3. API: `https://localhost:5001` (HTTP also on `http://localhost:5000`)
4. Swagger (dev): `https://localhost:5001/swagger`

**Rebuild Frontend Container (after UI changes)**
1. From `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src` run:
   ```
   docker compose up -d --no-deps --build resourcia.frontend
   ```
2. Hard refresh the browser (Ctrl+Shift+R).

**Local Development (without Docker)**
1. Backend:
   ```
   cd C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src
   dotnet restore
   dotnet run --project Resourcia.Api
   ```
2. Frontend:
   ```
   cd C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend
   npm install
   npm run start
   ```
3. Frontend uses `proxy.conf.json` to route `/api` to `https://localhost:5001`.

**Environment and Configuration Notes**
1. Frontend Turnstile keys live in `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\environments\environment.development.ts`.
2. Backend configuration file: `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\appsettings.json`
3. Backend development config: `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\appsettings.Development.json`
4. OAuth credentials are configured in `OAuthOptions` in appsettings (use secrets for real values).

**Browser Extension**
1. The extension lives in `C:\Users\matej\source\repos\ResourciaApi\ResourciaExtension`.
2. Load it as an unpacked extension in Chromium-based browsers.
3. It injects UI on Google Search result pages and can talk to the local API.

**Versioning & Releases**
1. Version is tracked in `C:\Users\matej\source\repos\ResourciaApi\VERSION` (SemVer).
2. Changelog lives in `C:\Users\matej\source\repos\ResourciaApi\CHANGELOG.md`.
3. For a release, run `pwsh .\scripts\update-version.ps1 -Version X.Y.Z`, then commit + tag.
4. Or trigger the GitHub **Release** workflow, which updates `VERSION`, regenerates the changelog, tags, and creates a GitHub Release.

**Testing**
1. Frontend unit tests: `cd C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend` then `npm run test -- --watch=false --browsers=ChromeHeadless`.
2. Frontend e2e tests: `cd C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend` then `npm run test:e2e`.
3. Backend unit + integration tests: `pwsh .\scripts\ci.ps1 -Task test -Scope backend`.
