# Security Report — Resourcia (2026-04-09)

## Scope
- Backend: `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api`
- Frontend: `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend`
- Configuration and repo root: `C:\Users\matej\source\repos\ResourciaApi`

## Summary
I reviewed authentication, token handling, configuration, and edge exposure. The highest-impact issues around exposed secrets and unsafe authentication flows have been substantially reduced, with remaining risk concentrated in token storage and brute-force protections.

## Risk Rating (Open)
- Critical: 1 (partial)
- High: 1 (partial)
- Medium: 1
- Low: 2 (1 open, 1 partial)

---

## Critical Findings

### C-1. Secrets and credentials committed in repository
- Evidence:
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\secrets.txt`
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\appsettings.json`
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\appsettings.Development.json`
- Impact: Credential leakage, environment compromise, OAuth app takeover, JWT forgery.
- Status: **Partially fixed** — tracked secrets removed from working tree, `.env`/`appsettings*.json` ignored, example templates added. **History may still contain old secrets** if previously pushed.
- Recommendation: Rotate all values and scrub git history if secrets were already pushed.

### C-2. Owner/Admin seed runs in all environments
- Evidence: `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Seedings\IdentitySeed.cs`
- Impact: Predictable admin account creation in production.
- Status: **Fixed** — seeding now runs only in Development or when `BOOTSTRAP_OWNER=true`.
- Recommendation: Keep `BOOTSTRAP_OWNER=false` outside first-run bootstrap.

---

## High Findings

### H-1. Email confirmation tokens returned in API responses
- Evidence: `AuthController.Register` and `ResendEmail` in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Impact: Email verification can be bypassed.
- Status: **Fixed** — confirmation tokens are no longer returned in API responses.

### H-2. CAPTCHA verification accepts any HTTP 200
- Evidence: `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Services\CaptchaService.cs`
- Impact: CAPTCHA can be bypassed.
- Status: **Fixed** — Turnstile response now parsed and requires `success=true`.

### H-3. Refresh cookie not marked Secure
- Evidence: Refresh cookie set with `Secure = false` in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Impact: Token transmission over HTTP possible.
- Status: **Fixed** — refresh cookie now always `Secure`, `HttpOnly`, `SameSite=Strict`.

### H-4. HTTPS redirection disabled
- Evidence: `UseHttpsRedirection()` commented out in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Program.cs`
- Impact: Cleartext access if API is exposed.
- Status: **Fixed** — HTTPS redirection enabled, HSTS added, forwarded headers configured.

### H-5. Access token stored in localStorage and accepted via query params
- Evidence:
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\app\app.component.ts`
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\app\core\auth\auth.service.ts`
- Impact: XSS-driven token theft; tokens leak via URL history/referrers.
- Status: **Partially fixed** — token query-param ingestion removed, but access tokens are still stored in `localStorage`.
- Recommendation: Move access tokens to HttpOnly cookies and eliminate localStorage usage.

---

## Medium Findings

### M-1. Login does not enforce lockout or rate limiting
- Evidence: `AuthController.Login` uses `CheckPasswordAsync` in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Impact: Brute-force risk.
- Status: **Open**
- Recommendation: Use `PasswordSignInAsync` with lockout and add rate limiting.

### M-2. User enumeration via error messages
- Evidence: `ForgotPassword` and `ResendEmail` return distinct errors in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Impact: Enables account discovery.
- Status: **Fixed** — `ForgotPassword` and `ResendEmail` now return generic OK responses.

### M-3. Authorization header can be sent to unintended URLs
- Evidence: `token.interceptor.ts` injects Bearer tokens on most requests in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\app\core\interceptors\token.interceptor.ts`
- Impact: Token leakage if any third-party URL is called.
- Status: **Fixed** — token interceptor now injects auth only for same-origin requests.

### M-4. Missing security headers
- Evidence: No CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Program.cs`
  or `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\nginx.conf`
- Impact: Increases XSS and clickjacking surface.
- Status: **Fixed** — headers added in API and Nginx.

### M-5. `proxy_ssl_verify off` in nginx
- Evidence: `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\nginx.conf`
- Impact: Accepts untrusted upstream certificates.
- Status: **Fixed** — Nginx now proxies to API over internal HTTP (no TLS verification bypass).

---

## Low Findings

### L-1. Password minimum length is 6
- Evidence: Identity password rules in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Program.cs`
- Status: **Open**
- Recommendation: Increase to 8-12, add strength guidance.

### L-2. Unprotected test email endpoint
- Evidence: `AuthController.TestMail` in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Status: **Fixed** — endpoint now requires `Admin`.

### L-3. Sensitive files exist despite `.gitignore`
- Evidence: `.gitignore` excludes secrets, yet they exist in the repo.
- Status: **Partially fixed** — tracked secrets removed; history may still contain old secrets.
- Recommendation: Verify git history and rotate any previously exposed secrets.

---

## Recommended Next Actions (Priority Order)
1. Rotate any secrets that were ever committed and scrub history if exposed.
2. Replace localStorage access tokens with HttpOnly cookie-based auth.
3. Add lockout and rate limiting to login endpoints.
