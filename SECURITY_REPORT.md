# Security Report — Resourcia (2026-04-07)

## Scope
- Backend: `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api`
- Frontend: `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend`
- Configuration and repo root: `C:\Users\matej\source\repos\ResourciaApi`

## Summary
I reviewed authentication, token handling, configuration, and edge exposure. The project contains multiple critical security exposures, primarily around secrets committed to the repository and unsafe authentication flows. Several high-risk issues could enable account takeover or data exposure in production if not addressed.

## Risk Rating
- Critical: 2
- High: 5
- Medium: 5
- Low: 3

---

## Critical Findings

### C-1. Secrets and credentials committed in repository
- Evidence:
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\secrets.txt`
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\appsettings.json`
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\appsettings.Development.json`
- Impact: Credential leakage, environment compromise, OAuth app takeover, JWT forgery.
- Recommendation: Remove secrets from repo, rotate all values, store via environment/secret manager, scrub git history if pushed.

### C-2. Owner/Admin seed runs in all environments
- Evidence: `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Seedings\IdentitySeed.cs`
- Impact: Predictable admin account creation in production.
- Recommendation: Gate seeding to Development only, or require runtime-only secrets not stored in repo.

---

## High Findings

### H-1. Email confirmation tokens returned in API responses
- Evidence: `AuthController.Register` and `ResendEmail` in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Impact: Email verification can be bypassed.
- Recommendation: Never return confirmation tokens via API; only send via email.

### H-2. CAPTCHA verification accepts any HTTP 200
- Evidence: `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Services\CaptchaService.cs`
- Impact: CAPTCHA can be bypassed.
- Recommendation: Parse Turnstile response and require `success = true` (optionally validate hostname/action).

### H-3. Refresh cookie not marked Secure
- Evidence: Refresh cookie set with `Secure = false` in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Impact: Token transmission over HTTP possible.
- Recommendation: Set `Secure = true` in production; consider SameSite policy tuning.

### H-4. HTTPS redirection disabled
- Evidence: `UseHttpsRedirection()` commented out in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Program.cs`
- Impact: Cleartext access if API is exposed.
- Recommendation: Enable HTTPS redirection and HSTS, or strictly isolate the API behind TLS-terminating proxy.

### H-5. Access token stored in localStorage and accepted via query params
- Evidence:
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\app\app.component.ts`
  - `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\app\core\auth\auth.service.ts`
- Impact: XSS-driven token theft; tokens leak via URL history/referrers.
- Recommendation: Prefer HttpOnly cookie-based auth; remove tokens from URLs.

---

## Medium Findings

### M-1. Login does not enforce lockout or rate limiting
- Evidence: `AuthController.Login` uses `CheckPasswordAsync` in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Impact: Brute-force risk.
- Recommendation: Use `PasswordSignInAsync` with lockout, add rate limiting.

### M-2. User enumeration via error messages
- Evidence: `ForgotPassword` and `ResendEmail` return distinct errors in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Impact: Enables account discovery.
- Recommendation: Return generic success messages.

### M-3. Authorization header can be sent to unintended URLs
- Evidence: `token.interceptor.ts` injects Bearer tokens on most requests in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\src\app\core\interceptors\token.interceptor.ts`
- Impact: Token leakage if any third-party URL is called.
- Recommendation: Restrict to same-origin or known API base.

### M-4. Missing security headers
- Evidence: No CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Program.cs`
  or `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\nginx.conf`
- Impact: Increases XSS and clickjacking surface.
- Recommendation: Add standard headers at edge or API.

### M-5. `proxy_ssl_verify off` in nginx
- Evidence: `C:\Users\matej\source\repos\ResourciaApi\ResourciaFrontend\nginx.conf`
- Impact: Accepts untrusted upstream certificates.
- Recommendation: Enable verification outside local dev.

---

## Low Findings

### L-1. Password minimum length is 6
- Evidence: Identity password rules in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Program.cs`
- Recommendation: Increase to 8-12, add strength guidance.

### L-2. Unprotected test email endpoint
- Evidence: `AuthController.TestMail` in
  `C:\Users\matej\source\repos\ResourciaApi\ResourciaBackend\src\Resourcia.Api\Controllers\AuthController.cs`
- Recommendation: Remove or restrict to admin/dev.

### L-3. Sensitive files exist despite `.gitignore`
- Evidence: `.gitignore` excludes secrets, yet they exist in the repo.
- Recommendation: Ensure they are not tracked; verify git history.

---

## Recommended Next Actions (Priority Order)
1. Remove secrets from repo, rotate all keys/credentials, scrub history.
2. Disable prod admin seeding; secure Owner/Admin creation.
3. Fix email token exposure, CAPTCHA validation, and HTTPS enforcement.
4. Replace localStorage tokens with HttpOnly cookies or safe storage.
5. Add rate limiting and security headers.
