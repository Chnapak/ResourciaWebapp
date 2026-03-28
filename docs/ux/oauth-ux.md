# Resourcia — OAuth & Authentication UX Design

> **Scope:** This document covers every authentication-related UX touchpoint on the Resourcia platform — sign-in/sign-up flows, access-gating, token lifecycle behaviour, error states, and the transition between anonymous and authenticated UI. It is written against the _current_ codebase: Angular frontend + ASP.NET Core Identity JWT backend with a custom `RefreshToken` table and Cloudflare Turnstile bot protection.
>
> **OAuth status:** OAuth (Google, Microsoft) is listed as a _future feature_ in `architecture.md`. The `IdentityUserLogin<Guid>` table is currently suppressed with `modelBuilder.Ignore<IdentityUserLogin<Guid>>()`. This document designs both the present (email/password) flow and the future OAuth flow so they share the same UX shell and require minimal rework to integrate.

---

## 1. Sign-in & Sign-up Page

### 1.1 — Single Entry-Point for Auth

**Problem:** The current routes expose `/login` and `/signup` as separate pages with no cross-linking context. A user who lands on `/login` without an account loses momentum, and vice versa.

**Recommended change:**
- Merge `/login` and `/signup` into a single `/auth` page with a **tab strip** (`Sign in` / `Create account`) that swaps the form in-place with a slide animation — no page reload.
- The URL hash (e.g. `/auth#signup`) or a `?mode=signup` query param controls the active tab so deep links still work.
- The existing `LoginPageComponent` and `RegistrationPageComponent` become dumb form sub-components loaded inside a shared `AuthPageComponent` shell.

**Expected benefit:** Eliminates the drop-off caused by requiring an extra click/navigation to switch intent. Conversion research consistently shows unified auth pages reduce abandonment by 15–25%.

---

### 1.2 — OAuth Provider Buttons (Future-Ready)

**Problem:** Once OAuth is added, injecting provider buttons into the existing form-only pages will feel bolted-on.

**Recommended change:**
Design the auth shell today to reserve space for OAuth above the form, separated by a visual "or" divider:

```
┌─────────────────────────────────────────────┐
│  [G]  Continue with Google                  │
│  [M]  Continue with Microsoft               │
├─────────────── or ──────────────────────────┤
│  Email ___________________________________  │
│  Password ________________________________  │
│                                             │
│  [   Sign in   ]                            │
└─────────────────────────────────────────────┘
```

- OAuth buttons use official brand colours (Google HSL(4,89%,52%), Microsoft #00a4ef, etc.) and the provider's own icon SVG — never substitute with generic icons.
- Buttons are full-width, 48 px tall, with 4 px rounded corners (matching the form's field style).
- While OAuth is not yet implemented, render the buttons in a disabled/greyed state with a tooltip: _"Coming soon — sign in with email for now."_ This acclimates users ahead of launch.

**Expected benefit:** Pre-trains users on the button locations; avoids a jarring UI change when OAuth launches. Disabled state is honest and expectation-setting.

---

### 1.3 — Cloudflare Turnstile Placement

**Problem:** The current registration and login endpoints require a Turnstile token. If the Turnstile widget is rendered at the bottom of the form (common default), users submit and get an error if the challenge hasn't completed yet.

**Recommended change:**
- Render the Turnstile widget **after the form fields load** but **before the submit button** in the DOM tab order.
- Keep the submit button **disabled** until both (a) form is valid and (b) Turnstile token is present.
- Show a subtle loading spinner inside the Turnstile container while the challenge initialises (typical: < 1 second on normal connections).
- On mobile, use the `compact` Turnstile appearance (`data-appearance="interaction-only"`) to reduce layout height.

**Expected benefit:** Eliminates the "submit before challenge completes" error class entirely, which is currently a silent failure point.

---

### 1.4 — Return-URL Preservation

**Problem:** `AuthService.requireAuth()` already stores a `returnUrl` in query params (`/login?returnUrl=...`) and routes there after login. However, this state is lost if the user navigates away or refreshes mid-flow.

**Recommended change:**
- On logout or token expiry, persist `returnUrl` to `sessionStorage` in addition to query params.
- After a successful login via either email/password or OAuth, read `sessionStorage.getItem('returnUrl')` first, fall back to the `returnUrl` query param, then fall back to `/`.
- Clear `returnUrl` from `sessionStorage` immediately after consuming it.

**Expected benefit:** Users who accidentally refresh the auth page are not dropped at the home screen — they continue directly to the resource or feature they were trying to reach.

---

## 2. Access Control Messaging

### 2.1 — Anonymous User Feature Gating

**Problem:** The current `canActivateGuard` on `/resource/:id` calls `getUserInfo()` which always returns an Observable — even for unauthenticated users it returns true (because it returns a truthy Observable reference, not the actual user). This means the guard doesn't actually block anonymous users. Additionally, anonymous users see no indication that certain actions require login.

**Recommended change:**

**Guard fix (`login.guard.ts`):**
```typescript
export const canActivateGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Read the reactive signal, not the Observable
  if (authService.isLoggedIn()) {  // convert BehaviorSubject to signal or use getValue()
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

**In-page gating (do not hard-gate entire resource page):**
- The resource detail page (`/resource/:id`) should be **public** (remove `canActivate`).
- Instead, gate individual _actions_ within the page: review submission, voting, discussion posting.
- Each gated action shows an inline prompt instead of silently failing or navigating away.

Inline prompt pattern (shown in place of the action UI):
```
┌──────────────────────────────────────────────┐
│  🔒  Sign in to write a review               │
│  Joining is free and takes 30 seconds.       │
│  [  Sign in  ]   [  Create account  ]        │
└──────────────────────────────────────────────┘
```

Apply this pattern consistently to:
| Feature | Prompt trigger |
|---|---|
| Writing a review | Click on star rating or "Write a review" button |
| Voting on a review | Click "Helpful" on any review |
| Starting a discussion | Click "Add comment" |
| Submitting a resource | Click "Add resource" in nav |
| Saving/bookmarking (future) | Click bookmark icon |

**Expected benefit:** Preserves the browsing experience for anonymous users (SEO, discoverability) while giving a clear, low-friction conversion path. Hard-gating an entire page kills SEO and frustrates users who want to read reviews first.

---

### 2.2 — Login Modal vs. Full-Page Redirect

**Problem:** The current flow always redirects to the `/login` page. This breaks context — a user reading a resource page who wants to vote on a review is dumped out of that page entirely.

**Recommended change:**
Introduce a global `AuthModalComponent` (singleton, rendered at the app root level):

- Triggered by `AuthService.openAuthModal(returnAction?)` instead of `router.navigate(['/login'])`.
- The modal contains the same tab-strip form from §1.1 (Sign in / Create account).
- After a successful login or OAuth callback inside the modal, it closes and the `returnAction` callback is executed immediately — e.g., submitting the review the user was filling out.
- For routes that require auth end-to-end (e.g. profile settings, admin), keep the full-page redirect.

**Decision matrix:**

| Scenario | Behaviour |
|---|---|
| User clicks star rating on resource page | Auth modal opens |
| User navigates directly to `/profile/:id` without login | Redirect to `/login?returnUrl=/profile/:id` |
| User tries to navigate to `/admin/*` without Admin role | Redirect to `/login` (no modal — hard block) |
| Session expires mid-page interaction | Modal appears, not hard redirect |

**Expected benefit:** Inline-modal login has 30–40% higher completion rates in SPA contexts versus full-page redirects, because the user's work-in-progress (e.g. a review draft) is not lost.

---

### 2.3 — Authenticated State Indicators in the Nav

**Problem:** The `isLoggedIn$` Observable is available but may not drive all nav UI consistently.

**Recommended change:**
- In the app layout's top navigation, reactively show:
  - **Anonymous:** `[Sign in]` button (primary CTA) + `[Create account]` link
  - **Authenticated:** User avatar/initials chip → dropdown (Profile, Settings, Logout)
- Use Angular's `async` pipe with `isLoggedIn$` so the nav updates instantly after login or logout without any manual change detection.
- Display a subtle badge on the user avatar for pending notifications (future: resource approval status, review replies).

**Expected benefit:** Always-accurate nav state prevents the "I'm logged in but still seeing a Sign In button" desync that erodes trust.

---

## 3. Token-Aware UI Behaviour

### 3.1 — Proactive Token Refresh (Before Expiry)

**Problem:** The current `tokenInterceptor` performs a reactive refresh — it waits for a `401` error, _then_ refreshes. If multiple concurrent requests fire simultaneously after expiry, all of them fail with `401` before the first refresh completes, causing multiple simultaneous refresh calls (refresh token replay attack surface).

**Recommended change:**
Introduce a **proactive refresh** strategy alongside the existing reactive one:

1. In `AuthService.initAuth()`, after validating the access token, decode the `exp` claim and schedule a `setTimeout` to fire at `(exp - 60 seconds)` from now.
2. At that time, silently call `refreshToken()` in the background.
3. In the interceptor, add a **queue/lock** guard: if a refresh is already in-flight, queue subsequent 401 requests and replay them after the single refresh resolves.

```typescript
// Interceptor pattern: serialise refresh calls
private refreshInProgress$ = new ReplaySubject<string>(1);
private isRefreshing = false;

// In catchError:
if (!this.isRefreshing) {
  this.isRefreshing = true;
  authService.refreshToken().pipe(
    tap(token => { this.refreshInProgress$.next(token); this.isRefreshing = false; })
  ).subscribe();
}
return this.refreshInProgress$.pipe(switchMap(token => next(req.clone(...))));
```

**Expected benefit:** Eliminates the "flash" of error states when access tokens expire mid-session. Prevents duplicate refresh token consumption which can lock users out.

---

### 3.2 — Expiry-Aware Disabled States

**Problem:** Anonymous users and users with expired tokens see the same UI — action buttons appear active but fail silently or redirect. There is no proactive disabled-state indicator.

**Recommended change:**
- Expose an `authState$` Observable with three states: `'anonymous' | 'authenticated' | 'token_expired'`.
- Buttons gated on auth show:
  - `'anonymous'` → enabled, clicking opens auth modal
  - `'authenticated'` → fully enabled
  - `'token_expired'` → disabled with a spinning refresh icon for 500–800 ms while the background refresh completes, then re-enabled with no user action required

**Expected benefit:** Users never click a button and stare at a broken state. The micro-animation signals that the UI is working, not broken.

---

### 3.3 — No-Reload UI Update After Login

**Problem:** After a successful login (modal or page), components that conditionally render based on auth state need to react. Angular signals or `async` pipes handle this if wired correctly, but some components may cache the initial anonymous state.

**Recommended change:**
- Ensure `isLoggedInSubject` is the _single source of truth_ — no component should read from `localStorage` directly.
- After OAuth login callback (when implemented), the backend redirects to `/auth/callback?token=...`. The callback route handler reads the token, stores it, calls `isLoggedInSubject.next(true)`, and then navigates to the `returnUrl`.
- Run the `pendingAction` pipeline (`runPendingAction()`) inside the callback handler so any deferred user action (e.g. "vote on review") fires immediately.

**Expected benefit:** Seamless post-login experience. Users don't need to manually refresh to see their avatar, their saved state, or to complete the action they initiated.

---

## 4. OAuth Provider Flow (Future Implementation)

### 4.1 — Backend Prerequisites

Before any OAuth UX can be implemented, the backend schema change is required:

1. Remove `modelBuilder.Ignore<IdentityUserLogin<Guid>>()` from `AppDbContext` (or add a custom `ExternalLogin` table) — see `architecture.md` risk item.
2. Add `.AddGoogle(...)` / `.AddMicrosoftAccount(...)` to the `AddAuthentication()` chain in `Program.cs`.
3. Add a new endpoint:
   - `GET /api/auth/oauth/{provider}` — initiates the OAuth redirect
   - `GET /api/auth/oauth/callback` — handles the provider callback, creates/links the `AppUser`, issues JWT + refresh token, redirects to `POST /auth/callback` on the frontend

### 4.2 — OAuth Callback Route

Add `/auth/callback` as a dedicated Angular route (currently absent from `app.routes.ts`):

```typescript
{ path: 'auth/callback', component: OAuthCallbackComponent, title: 'Signing you in...' }
```

The `OAuthCallbackComponent`:
1. Reads `?token=` and `?refreshToken=` from query params (set by the backend redirect).
2. Stores them to `localStorage`.
3. Updates `isLoggedInSubject`.
4. Runs `pendingAction` if present.
5. Navigates to `returnUrl`.

Display during this component's transient lifetime:
```
┌──────────────────────────────────┐
│                                  │
│    [Google G logo spinning]      │
│    Signing you in…               │
│                                  │
└──────────────────────────────────┘
```
- Avoid any interactive elements — it is a loading-only screen.
- If the token params are missing (user landed here manually), redirect to `/login`.

**Expected benefit:** A polished, intentional-feeling OAuth callback instead of a flash of blank screen or broken HTML.

---

### 4.3 — Account Linking

**Problem:** A user who previously registered with email/password at `alice@example.com` then clicks "Continue with Google" using the same email will end up with two unlinked accounts or an error.

**Recommended change:**
- Backend: If the OAuth provider's email matches an existing `AppUser`, **link** the external login to that account (add to `IdentityUserLogin`) rather than creating a new user. Issue a JWT for the existing account.
- Frontend: If the backend returns a `LINK_REQUIRED` error code, show a modal:

```
┌─────────────────────────────────────────────────────┐
│  We found an account with this email address.        │
│                                                      │
│  Sign in with your password to link Google login,   │
│  and you can use either method in future.           │
│                                                      │
│  Email: alice@example.com                           │
│  Password: ________________________________         │
│                                                      │
│  [  Link accounts  ]   [  Cancel  ]                 │
└─────────────────────────────────────────────────────┘
```

**Expected benefit:** Prevents duplicate accounts (a major source of user confusion and support tickets) while still completing the user's intent.

---

### 4.4 — Denied Permissions / Cancelled OAuth

**Problem:** If a user closes the Google OAuth popup or denies the requested scopes, the backend receives no callback and the frontend is left waiting.

**Recommended change:**
- Use a **popup** window for OAuth (not a full redirect) where possible. The popup communicates back to the parent window via `postMessage` on success or closure.
- If the popup is closed without a success message, show a non-blocking toast:
  _"Sign-in cancelled. Continue browsing or try again."_
- Do not show an error modal — cancelling is a valid choice, not a failure.
- If the backend callback returns an `OAUTH_DENIED` error code, show:
  _"Google reported that you didn't grant the required permissions. Only basic profile access is needed — try again."_

**Expected benefit:** Removes the "page stuck waiting" failure mode and gives users clear, blame-free messaging to retry.

---

## 5. Error Handling & Edge Cases

### 5.1 — Expired Access Token (Token-Based, Not OAuth-Specific)

**Problem:** The interceptor retries with a new token on `401`, but if the refresh token has also expired (e.g. user hasn't visited in 7+ days), `refreshToken()` itself returns a `401`. The current interceptor has no handling for this second-level failure — `refreshToken()` errors are not caught, so the Observable completes with an unhandled error.

**Recommended change:**
In the interceptor's `catchError` around the refresh attempt:

```typescript
catchError((refreshError) => {
  // Refresh itself failed — session is dead
  authService.handleSessionExpired(); // clears localStorage, updates subject
  return throwError(() => refreshError);
})
```

`handleSessionExpired()` in `AuthService`:
1. Removes `accessToken` from `localStorage`.
2. Sets `isLoggedInSubject.next(false)`.
3. If the current route is a hard-gated route (profile, admin), redirects to `/login`.
4. Otherwise, shows a global toast: _"Your session expired. Sign in again to continue."_ and opens the auth modal.

**Expected benefit:** No silent failures. The user always knows why they were signed out, and they are offered an immediate path back in.

---

### 5.2 — Failed OAuth Login (Server-Side Error)

If the backend returns a non-`200` from `/api/auth/oauth/callback` (e.g. the provider token was invalid, or the user's account is suspended):

| Backend error code | User-facing message | Action |
|---|---|---|
| `OAUTH_INVALID_TOKEN` | "Something went wrong with the sign-in. Please try again." | Retry button |
| `USER_SUSPENDED` | "Your account has been suspended: [ModerationReason]." | Link to support |
| `USER_BANNED` | "Your account has been banned: [ModerationReason]." | No retry |
| `EMAIL_NOT_VERIFIED` | "Please verify your email before signing in." | Resend email button |
| Generic 500 | "A server error occurred. Please try again in a moment." | Retry button |

Render these errors **within the auth modal/callback page**, not as browser alerts or console logs.

---

### 5.3 — Suspended / Banned User

The platform already has a `SuspensionMessagePageComponent` at `/suspended`. Wire it in correctly:

**Recommended change:**
- `AuthService.login()` (and the OAuth callback handler) must read the response body for `USER_LOCKED_OUT`.
- The `token.interceptor.ts` already checks for `error.error?.error !== "USER_LOCKED_OUT"` before attempting refresh — this is correct. Ensure the login flow also checks it.
- On a suspension response, redirect to `/suspended` passing the `ModerationReason` as a route state parameter (not a query param — never expose moderation reasons in the URL):

```typescript
this.router.navigate(['/suspended'], { state: { reason: error.error.reason } });
```

**Expected benefit:** Users understand exactly why they can't log in. They don't get stuck in an infinite login loop wondering why their credentials fail.

---

### 5.4 — Account Not Yet Verified (Email Confirmation)

**Problem:** The backend requires `RequireConfirmedAccount = true`. Unverified users who try to log in will receive a `400/401` — currently no special UX handles this post-login.

**Recommended change:**
- On login failure with code `EMAIL_NOT_CONFIRMED`, show an inline error beneath the form:
  _"You haven't confirmed your email yet. [Resend confirmation email ↗]"_
- The resend link triggers `AuthService.resendEmail()` with the user's email pre-filled.
- Show a success toast after resend: _"Confirmation email sent — check your inbox and spam folder."_

After clicking the confirm link in the email, the user lands on `/confirm-token?token=...&email=...`. Upon successful validation, auto-redirect to `/auth?mode=login` with a success banner: _"Email confirmed! You can now sign in."_

**Expected benefit:** Eliminates dead ends for users who didn't complete verification immediately after registration.

---

## 6. Mobile & Responsive Behaviour

### 6.1 — Auth Modal on Mobile

**Problem:** A full-size auth modal on a 375 px mobile screen often clips, overlaps the keyboard, or is difficult to dismiss.

**Recommended change:**
- On viewports < 640 px (`sm` breakpoint), render the auth modal as a **bottom sheet** instead of a centred dialog.
- The bottom sheet slides up from the bottom with a `translateY` animation (200 ms ease-out).
- Include a drag handle at the top of the sheet. Dragging down by > 30% of sheet height dismisses it.
- When the keyboard appears (detected via `visualViewport` API), shrink the sheet height to the area above the keyboard.

**Expected benefit:** Bottom sheets are the standard mobile pattern for overlaid actions (used by Google, Apple, etc.). They feel native rather than shrunken desktop.

---

### 6.2 — OAuth Button Tap Targets

**Recommended change:**
- All OAuth provider buttons must be at least **48 × 48 px** (WCAG 2.5.5 AA, also Google's own tap-target guidance).
- Avoid placing provider buttons too close together — use at least 8 px vertical gap.
- On touch devices, suppress the button's `hover` pseudo-class styles to avoid sticky hover states.

---

### 6.3 — Progressive Disclosure on Small Screens

On the login page for mobile:
- Collapse the "or sign up" link beneath the form rather than showing it inline.
- Show the Turnstile widget in `interaction-only` mode (renders as a checkbox, not an iframe).
- Stack the form at full width with 16 px horizontal padding.

---

## 7. Smooth Anonymous → Authenticated Transitions

### 7.1 — Skeleton States for Auth-Dependent Sections

**Problem:** When `initAuth()` runs on app start (it's set as an `APP_INITIALIZER`), there is a brief period where `isLoggedIn$` is still resolving. Any component that renders conditionally on auth state will flicker.

**Recommended change:**
- Add a third state to auth: `'initialising'`. Set this before `initAuth()` is called.
- While `'initialising'`, render auth-dependent sections (nav user chip, gated action buttons) as **skeleton loaders** — grey animated pill shapes of the same dimensions.
- Once `initAuth()` resolves (success or failure), immediately swap to the real UI.
- Target total `initAuth()` round-trip ≤ 200 ms (it is a single server-verified call to `/api/Auth/UserInfo`).

**Expected benefit:** Eliminates the signed-in-user flash of the Sign In button that occurs on every page load. Creates a polished, app-like feel rather than a raw HTML render.

---

### 7.2 — Post-Login Action Replay

The `pendingAction` system in `AuthService` (`setPendingAction` / `runPendingAction`) is already in place but unused in components. Wire it into the existing flows:

**Recommended change:**
- Gated action components (star rating, vote button, discussion reply box) call `authService.setPendingAction({ type: 'SUBMIT_REVIEW', payload: { resourceId, rating, content } })` before triggering the auth modal/redirect.
- After successful login, `OAuthCallbackComponent` and the auth modal's success handler both call `runPendingAction()` and dispatch the action to the appropriate service.
- Define a central `PendingActionDispatcher` service that maps action types to service calls.

**Expected benefit:** A user who fills out a 3-paragraph review, clicks "Submit", is asked to log in, logs in via Google, and then sees their review submitted automatically — with zero data loss. This is the gold standard for auth-gated flows.

---

### 7.3 — Logout UX

**Problem:** `AuthService.logout()` currently calls `POST /api/Auth/Logout`, then navigates to `/login`. This is jarring — the user is abruptly removed from whatever page they were on.

**Recommended change:**
- After logout, redirect to `/` (home), not `/login`.
- Show a non-blocking toast: _"You've been signed out."_ (auto-dismiss after 4 seconds).
- Anonymous users can continue browsing; the CTA to sign back in is always visible in the nav.
- Exception: if the user was on an auth-required route when they logged out, then redirecting to `/login` is correct.

**Expected benefit:** Logout feels like a graceful state change, not an eviction. Users who log out by accident can immediately sign back in with minimal disruption.

---

## 8. Security UX Considerations

### 8.1 — Access Token Storage

**Problem:** Access tokens are stored in `localStorage`, which is accessible to any JavaScript on the page (XSS vector).

**Recommendation for future hardening:**
- Move access tokens to **`HttpOnly` cookies** if the architecture allows (same-domain API). This is a backend change.
- If `localStorage` must be kept: ensure Content Security Policy headers prevent inline script injection (Cloudflare Turnstile already requires a strict CSP).
- Never log token values to the console. Remove `console.log(clonedRequest)` in the interceptor before production.

---

### 8.2 — OAuth State Parameter (CSRF Protection)

When OAuth is implemented, the backend must:
- Generate a cryptographically random `state` parameter before redirecting to the provider.
- Validate the `state` parameter on callback before accepting the code.
- If state mismatch: show error _"This sign-in session has expired or may have been tampered with. Please try again."_ and do not issue any token.

**Expected benefit:** Prevents CSRF attacks targeting the OAuth callback endpoint.

---

### 8.3 — Sensitive Page Transitions

When navigating to or from auth pages:
- Prevent the browser's back button from returning a logged-out user to a page that required auth (use Angular's route resolver or `replaceUrl: true` on redirect).
- After logout, use `router.navigate(['/'], { replaceUrl: true })` so `/profile` or `/admin` is not in the browser history.

---

## 9. Implementation Checklist

### Immediate (email/password flow hardening)

- [ ] Fix `login.guard.ts` — it currently always returns `true` because `getUserInfo()` returns a truthy Observable
- [ ] Fix `token.interceptor.ts` — add refresh lock to prevent concurrent refresh calls
- [ ] Handle `refreshToken()` failure cleanly — call `handleSessionExpired()` on double-401
- [ ] Remove `console.log` statements from interceptor and auth service before production
- [ ] Keep submit button disabled until Turnstile token is present
- [ ] Persist `returnUrl` to `sessionStorage` to survive page refreshes
- [ ] Wire `pendingAction` into at least one gated action component (star rating recommended)
- [ ] Add `'initialising'` state to suppress nav flicker on app load
- [ ] Implement skeleton loaders for auth-dependent nav elements
- [ ] Redirect to `/` (not `/login`) after clean logout
- [ ] Pass `ModerationReason` via router state to `/suspended`, not query params

### Pre-OAuth (schema & backend prep)

- [ ] Decide on OAuth table strategy: re-enable `IdentityUserLogin<Guid>` vs. custom table
- [ ] Add `/auth/callback` Angular route
- [ ] Design backend `LINK_REQUIRED` flow for email collision
- [ ] Confirm OAuth provider credentials (client IDs) for Google, Microsoft

### At OAuth launch

- [ ] Render OAuth buttons (disabled state now, enabled at launch)
- [ ] Implement `OAuthCallbackComponent`
- [ ] Implement account linking modal
- [ ] Implement popup-based OAuth initiation with `postMessage` handshake
- [ ] Handle all OAuth error codes with user-facing messages
- [ ] Validate `state` parameter on every OAuth callback
- [ ] Add `auth/callback` route to Angular router with no auth guard

---

## Appendix: Auth State Machine

```
          ┌────────────────────────────────────────────────┐
          │                  INITIALISING                  │
          │  (APP_INITIALIZER running / skeleton shown)    │
          └────────────────┬───────────────────────────────┘
                           │  initAuth() resolves
              ┌────────────┴───────────────┐
              │                            │
              ▼                            ▼
     ┌─────────────────┐          ┌─────────────────┐
     │    ANONYMOUS    │◄─────────│  AUTHENTICATED  │
     │  (no token or   │  logout  │  (valid JWT +   │
     │   invalid JWT)  │          │   refresh token)│
     └────────┬────────┘          └────────┬────────┘
              │ login / OAuth              │
              │ success                   │ access token nears expiry
              └──────────────►────────────┤ (60 s before exp)
                                          │ silent refresh()
                                          ▼
                                 ┌─────────────────────┐
                                 │   TOKEN_REFRESHING  │
                                 │   (≤ 800 ms)        │
                                 └────────┬────────────┘
                                          │
                              ┌───────────┴────────────┐
                              │ success                │ failure (refresh expired)
                              ▼                        ▼
                      AUTHENTICATED             handleSessionExpired()
                                                → toast + auth modal
                                                → ANONYMOUS
```
