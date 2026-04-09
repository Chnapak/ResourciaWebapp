## [0.2.5] - 2026-04-09

### Highlights
- Added CI secret scanning via Gitleaks with repo allowlist config.
- Added `scripts/rotate-secrets.ps1` helper and documented rotation in security report.

---
## [0.2.4] - 2026-04-09

### Highlights
- Rewrote git history to remove previously committed secrets (`.env`, `appsettings*.json`).
- Security report updated to mark history cleanup as resolved.

---
## [0.2.3] - 2026-04-09

### Highlights
- Cookie-based access tokens (HttpOnly) replace localStorage; auth now uses `/UserInfo` for session state.
- Login lockout + rate limiting added to auth endpoints.
- Backend password policy minimum length raised to 8.

---
## [0.2.2] - 2026-04-09

### Highlights
- Security hardening: stop returning confirmation tokens from auth endpoints and enforce generic responses for email flows.
- Turnstile verification now requires `success=true`.
- Refresh cookie now `Secure` + `HttpOnly`; HTTPS redirection, HSTS, and forwarded headers enabled.
- Token header injection limited to same-origin requests.
- Added security headers in API and Nginx; removed `proxy_ssl_verify off` by proxying to API over internal HTTP.

---
## [0.2.1] - 2026-04-09

### Highlights
- Stop tracking local secrets/config (`.env`, `appsettings.json`, `appsettings.*.json`) to keep credentials out of git.
- Added/updated safe example config templates (`.env.example`, `appsettings.example.json`, `appsettings.Development.example.json`).
- Owner bootstrap seeding now runs only in Development or when `BOOTSTRAP_OWNER=true`.
- Ignore API upload artifacts under `wwwroot/uploads/`.

---
## [0.2.0] - 2026-04-07

### Highlights
- Profile photo upload + removal in the Edit Profile page.
- Avatars shown across profiles, reviews, discussions, and admin user lists.
- New avatar API endpoints and DB migration for `AppUser`.
- Avatar edit badge clickability fix.

---
## [0.1.0] - 2026-04-05

### Highlights
- Responsive layouts across auth, admin, search, and home pages.
- Skeleton loading states for search results, resource detail, and admin lists.
- Mobile navigation/branding tweaks for consistent Resourcia logo display.
- Frontend Nginx dev cert auto-generation for local HTTPS.
- Ignored local `.containers` data to prevent DB artifacts in git.

---

## [0.0.0](https://github.com/Chnapak/ResourciaWebapp/compare/v0.1.0...v0.0.0) (2026-04-05)

## [0.1.0](https://github.com/Chnapak/ResourciaWebapp/compare/a84afe94cccc93c03b0d07d29c3815753d38e355...v0.1.0) (2026-04-05)

### Features

* ... --- ... ([f9ffe9d](https://github.com/Chnapak/ResourciaWebapp/commit/f9ffe9d09ff1399fdbc1e481e18a9064cbb177b4))
* ... --- ... ([7ea4358](https://github.com/Chnapak/ResourciaWebapp/commit/7ea43584b016c59db5d5ca3f02dfd3e12b00e8fd))
* ... --- ... ([cf3b9f2](https://github.com/Chnapak/ResourciaWebapp/commit/cf3b9f2ee0df12add386c047cb210dd144778a74))
* ... --- ... ([a1d176f](https://github.com/Chnapak/ResourciaWebapp/commit/a1d176f4554a588239980854b89eb2e6ed0ed233))
* adding new filters ([792674b](https://github.com/Chnapak/ResourciaWebapp/commit/792674b1a49b62163e9b5ee82df81122be2f462c))
* better search engine ([878638f](https://github.com/Chnapak/ResourciaWebapp/commit/878638f271ac882f68275552ad686ed0fa6d8db4))
* comments ([57bdb7e](https://github.com/Chnapak/ResourciaWebapp/commit/57bdb7ef95121862e3fb6b4f35261c47dcd3dc99))
* comments and reviews ([0efbe4f](https://github.com/Chnapak/ResourciaWebapp/commit/0efbe4f1725b77a2fc8d098a2a4821a3cb376862))
* connected to backend ([f6608d9](https://github.com/Chnapak/ResourciaWebapp/commit/f6608d9557f42d19b5b0c68431dc7b0c8411b2e1))
* frontend in docker compose ([ea1f553](https://github.com/Chnapak/ResourciaWebapp/commit/ea1f5538a7bf802ba89889d5cf4dc6fc8179bc06))
* checkbox facet component ([780eeb0](https://github.com/Chnapak/ResourciaWebapp/commit/780eeb06fa3e8c6e707b0454196d0b19bc2e7fa6))
* chrome extension I've been working on ([4bb6285](https://github.com/Chnapak/ResourciaWebapp/commit/4bb6285efc3117bc4d49b102d0408045c728265b))
* lazy loading ([7d18fda](https://github.com/Chnapak/ResourciaWebapp/commit/7d18fdaf35d9e915ce3d8330ff3dbe46dbc87a5a))
* oauth, review endpoints, refactor ([48a772f](https://github.com/Chnapak/ResourciaWebapp/commit/48a772fd15a50cda4d2a6ff1d2cde426f5b7044d))
* pictures and such ([43a5f8c](https://github.com/Chnapak/ResourciaWebapp/commit/43a5f8c64b3c6ff1c63e00335e0ab069ff78da5d))
* profile edit page component ([00ed1f6](https://github.com/Chnapak/ResourciaWebapp/commit/00ed1f61ad757e1191a62b471c1d19ee2db7b51d))
* profile page component facelift ([d1bea75](https://github.com/Chnapak/ResourciaWebapp/commit/d1bea758519c272694c47d42241531c08a9157fe))
* radio facet component ([a84afe9](https://github.com/Chnapak/ResourciaWebapp/commit/a84afe94cccc93c03b0d07d29c3815753d38e355))
* rating, reviews and discussion ([51525b6](https://github.com/Chnapak/ResourciaWebapp/commit/51525b6aedee750d4d9ad5d00ffef5fde92884bc))
* read.me + documentace (vím, že to je pozdě) ([55acff0](https://github.com/Chnapak/ResourciaWebapp/commit/55acff0379ecaec96d4f3fa134377b1f22ed64f0))
* resource page info + add resource page functional ([10b1ea4](https://github.com/Chnapak/ResourciaWebapp/commit/10b1ea4f1fd8c3a248aff638147fb431d2811702))
* saving resources ([5899f59](https://github.com/Chnapak/ResourciaWebapp/commit/5899f59420bf7c692821a03dd9c6e1a81933f1d8))
* searchanle-single-facet component ([9c2cef8](https://github.com/Chnapak/ResourciaWebapp/commit/9c2cef82cc7c9f538a77c944e04c4cb51252b045))
* soft delete of resources, filters and users ([3e6097a](https://github.com/Chnapak/ResourciaWebapp/commit/3e6097a5e8fc883009ef02821ad707bf6bc04ffd))

### Bug Fixes

* clean version without zip files ([b0db625](https://github.com/Chnapak/ResourciaWebapp/commit/b0db625823a5dd3e3c3fe0f570aa5a270b5fac6c))
* gitignore ([445c8cd](https://github.com/Chnapak/ResourciaWebapp/commit/445c8cd61dc2a2e43c3dad04871525cef84c393f))
* http -> https ([b8aae4b](https://github.com/Chnapak/ResourciaWebapp/commit/b8aae4bf4f7a5ff0c1f80ebdacfcf89a8aaac5d7))
* http -> https ([6e62d46](https://github.com/Chnapak/ResourciaWebapp/commit/6e62d46f889171b549782a3965dc5d9a451855d0))
* links to profiles in resources ([2dad396](https://github.com/Chnapak/ResourciaWebapp/commit/2dad396339ca33e4f33f2d69a4ebf2e3c6d1013f))
* merge conflicts??? ([ff69649](https://github.com/Chnapak/ResourciaWebapp/commit/ff69649e5a8fd19241cdfafb28ac4fd9e9be679e))
* resource card ([49e602d](https://github.com/Chnapak/ResourciaWebapp/commit/49e602d2445c499feb08f740efa94685c883a922))
* routing ([6b3600d](https://github.com/Chnapak/ResourciaWebapp/commit/6b3600dcfa7eb7b07dcd881e28a718283d5f56ac))
* verification process fixed ([0307ef6](https://github.com/Chnapak/ResourciaWebapp/commit/0307ef66976a60568d4cddd74999d5f8b952b25a))
