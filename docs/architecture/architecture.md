# Resourcia — Backend Architecture Design

A platform for discovering, reviewing, and organizing educational resources.

---

## Overview

Resourcia is a **resource discovery platform** with user accounts, dynamic admin-managed filters, faceted search, reviews/ratings, discussions, and lightweight analytics. The backend is an ASP.NET Core Web API backed by PostgreSQL, consumed by an Angular frontend.

**Core design principles:**
- Admins can define new filter types dynamically from the admin hub — no code change required
- Ratings are stored in a dedicated `ResourceRatings` table with per-star breakdown (not a flat cache on `Resource`)
- Soft deletes via the `ITrackable` pattern (`DeletedAt/By`) used across all audited entities
- `NodaTime.Instant` used throughout in place of `DateTime` (where already established)
- JWT auth with custom `RefreshToken` table; Cloudflare Turnstile already wired in (`CaptchaService`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | ASP.NET Core (C#) — Web API |
| **Frontend** | Angular |
| **Auth** | ASP.NET Core Identity (`IdentityCore`) + JWT Bearer + custom `RefreshToken` |
| **Bot protection** | Cloudflare Turnstile (`CaptchaService` already registered) |
| **OAuth** | Not yet implemented — requires removing `modelBuilder.Ignore<IdentityUserLogin<Guid>>()` or a custom table |
| **ORM** | Entity Framework Core + Npgsql |
| **Database** | PostgreSQL |
| **Time** | NodaTime (`Instant`) |
| **Images** | Served from `wwwroot/uploads/` via `ImageService` |

---

## Existing Entities

These entities are already implemented in `Resourcia.Data`.

---

### `AppUser` *(Identity/AppUser.cs)*
Extends `IdentityUser<Guid>`. Managed via ASP.NET Core Identity.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | From IdentityUser |
| `Email` | string | From IdentityUser |
| `UserName` | string | From IdentityUser |
| `DisplayName` | string | Custom |
| `Status` | enum: `Active`, `Suspended`, `Banned` | Moderation status |
| `ModerationReason` | string? | Reason for suspension/ban |
| `ModeratedBy` | Guid? FK → AppUser | Admin who actioned it |
| `Posts` | nav → Post[] | |
| `CreatedAt/By`, `ModifiedAt/By`, `DeletedAt/By` | ITrackable | Soft delete supported |

---

### `AppRole` *(Identity/AppRole.cs)*
Extends `IdentityRole<Guid>`. Roles are used for `[Authorize(Roles = "...")]`.

---

### `RefreshToken` *(Identity/RefreshToken.cs)*
Custom refresh token table (Identity's built-in token store is ignored).

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `UserId` | Guid FK → AppUser | |
| `Token` | string | Opaque token |
| `CreatedAt` | Instant | |
| `ExpiresAt` | Instant | |
| `RevokedAt` | Instant? | Null = still valid |
| `RequestInfo` | string? | User-agent / IP snapshot |

---

### `FilterDefinitions` *(FilterDefinitions.cs)*
Admin-managed filter definitions. Admins create filters from the admin hub — no deployment needed.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `Key` | string (unique, max 64) | Slug used in API requests |
| `Label` | string (max 128) | Display name |
| `Description` | string? (max 512) | |
| `Kind` | enum: `Facet`, `Range`, `Boolean`, `Text` | Determines UI control and query logic |
| `IsMulti` | bool | Allow multiple values selected |
| `IsActive` | bool | Toggle visibility without deleting |
| `SortOrder` | decimal | UI ordering |
| `ResourceField` | string? (max 64) | Maps to a direct field on `Resource` (e.g. `IsFree`, `Year`) for non-Facet kinds |
| `FacetValues` | nav → FacetValues[] | Only populated for `Kind = Facet` |
| `CreatedAt/By`, `ModifiedAt/By`, `DeletedAt/By` | ITrackable | |

**Filter kinds explained:**
- `Facet` — multi-select from a predefined list (e.g. Subject: Math, Science). Backed by `FacetValues`.
- `Boolean` — toggle (e.g. Free only). Maps directly to a bool field on `Resource` via `ResourceField`.
- `Range` — numeric range (e.g. Year: 2010–2024). Maps to a numeric field on `Resource`.
- `Text` — free-text search against a string field (e.g. Author). Maps via `ResourceField`.

---

### `FacetValues` *(FacetValues.cs)*
The selectable options within a `Facet`-kind filter.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `FilterDefinitionsId` | Guid FK → FilterDefinitions | |
| `Value` | string (max 128) | Stable slug — used in API requests. Never rename. |
| `Label` | string (max 256) | Display text |
| `IsActive` | bool | Toggle visibility |
| `SortOrder` | int | |

Unique index: `(FilterDefinitionsId, Value)`

---

### `Resource` *(Resource.cs)*
The core content entity.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `Title` | string | |
| `Description` | string? | |
| `Url` | string | Target website |
| `IsFree` | bool | |
| `Year` | int? | Publication year |
| `Author` | string? | |
| `LearningStyle` | string | e.g. "Video", "Interactive", "Reading" |
| `Tags` | `List<string>` | Stored as a PostgreSQL array (informal tags, separate from facets) |
| `SavesCount` | int | Denormalized bookmark/save counter |
| `CreatedAtUtc` | DateTime | *(Note: uses DateTime, not NodaTime — inconsistent with other entities)* |
| `UpdatedAtUtc` | DateTime | |
| `ResourceFacetValues` | nav → ResourceFacetValues[] | |
| `ResourceReviews` | nav → ResourceReview[] | |
| `Discussions` | nav → Discussions[] | |
| `Ratings` | nav → ResourceRatings | 1-to-1 |
| `Images` | nav → ResourceImage[] | |

> **Note:** `Resource` does not yet have a `Status` field or a `SubmittedByUserId` field. These are required additions to support the user resource submission + admin approval workflow (see **Missing Entities & Fields**).

---

### `ResourceFacetValues` *(ResourceFacetValues.cs)*
Junction table: many-to-many between `Resource` and `FacetValues`.

| Column | Type |
|---|---|
| `ResourceId` | Guid FK → Resource |
| `FacetValuesId` | Guid FK → FacetValues |

Composite PK: `(ResourceId, FacetValuesId)`

---

### `ResourceRatings` *(ResourceRatings.cs)*
1-to-1 with `Resource`. Tracks aggregate rating data with per-star breakdowns.

| Column | Type | Notes |
|---|---|---|
| `ResourceId` | Guid PK + FK → Resource | |
| `AverageRating` | float | Recomputed on each review write |
| `TotalCount` | int | Total number of ratings |
| `Count1`–`Count5` | int | Per-star counts |

---

### `ResourceReview` *(ResourceReview.cs)*
One review per user per resource.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `ResourceId` | Guid FK → Resource | Cascade delete |
| `UserId` | Guid FK → AppUser | |
| `Rating` | int (1–5) | |
| `Content` | string | Review body |
| `CreatedAt` | Instant? | |
| `UpdatedAt` | Instant? | |
| `Votes` | nav → ReviewVotes[] | Helpfulness votes |

---

### `ReviewVotes` *(ReviewVotes.cs)*
Tracks whether a review was helpful.

| Column | Type |
|---|---|
| `ReviewId` | Guid (part of composite PK) |
| `UserId` | Guid (part of composite PK) |
| `IsHelpful` | bool |

Composite PK: `(ReviewId, UserId)`

---

### `Discussions` *(Discussions.cs)*
Top-level discussion thread on a resource.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `ResourceId` | Guid FK → Resource | Cascade delete |
| `UserId` | Guid FK → AppUser | |
| `Content` | string | |
| `CreatedAt` | Instant | |
| `Replies` | nav → DiscussionReplies[] | |

---

### `DiscussionReplies` *(DiscussionReplies.cs)*
Reply to a `Discussions` thread.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `DiscussionId` | Guid FK → Discussions | Cascade delete |
| `UserId` | Guid FK → AppUser | |
| `Content` | string | |

---

### `ResourceImage` *(ResourceImage.cs)*
Uploaded images for a resource, served from `wwwroot/uploads/`.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `ResourceId` | Guid FK → Resource | |
| `FileName` | string | Randomised safe filename |
| `OriginalFileName` | string | User's original filename |
| `ContentType` | string | `image/png`, `image/jpeg`, etc. |
| `UploadedAtUtc` | DateTime | |
| `UploadedByUserId` | Guid | |
| `IsDeleted` | bool | Soft delete |
| `DeletedAtUtc` | DateTime? | |
| `DeletedByUserId` | Guid? | |

---

### `Post` + `Comment` *(Post.cs, Comment.cs)*
Community feed / post system. `Post` belongs to `AppUser`. `Comment` belongs to a `Post`.
Full `ITrackable` audit trail. Used for community news/announcements or user posts.

---

### `EmailMessage` *(EmailMessage.cs)*
Email queue entity. Picked up by `EmailSenderBackgroundService` and dispatched via SMTP.

---

## Entity Relationships

```
AppUser ──< Post ──< Comment
AppUser ──< ResourceReview ──< ReviewVotes
AppUser ── AppRole (via IdentityUserRole)

Resource ──< ResourceFacetValues >── FacetValues ──< FilterDefinitions
Resource ──  ResourceRatings (1:1)
Resource ──< ResourceReview
Resource ──< Discussions ──< DiscussionReplies
Resource ──< ResourceImage

RefreshToken >── AppUser
```

---

## Missing Entities & Fields *(to be added)*

These do not exist in code yet and are required to complete the described feature set.

### Fields to add to `Resource`
| Field | Type | Notes |
|---|---|---|
| `Status` | enum: `Draft`, `PendingReview`, `Published`, `Rejected`, `Archived` | Required for submission/approval workflow |
| `SubmittedByUserId` | Guid FK → AppUser | Who submitted the resource |

**Status transition rules:** `Draft → PendingReview` (user submits) → `Published` or `Rejected` (admin decides) → `Archived` (admin retires). Enforce in the service layer, not just the controller.

---

### New entity: `UserPreference`
Stores which `FacetValues` a user prefers, used for personalised recommendations.

| Column | Type | Notes |
|---|---|---|
| `UserId` | Guid FK → AppUser | |
| `FacetValuesId` | Guid FK → FacetValues | |

Composite PK: `(UserId, FacetValuesId)`

---

### New entity: `Interaction`
Lightweight engagement event log for analytics and recommendation signals.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `ResourceId` | Guid FK → Resource | |
| `UserId` | Guid FK → AppUser, nullable | Null = anonymous |
| `SessionId` | string? | Anonymous session grouping |
| `Type` | enum: `Click`, `Upvote`, `Downvote` | (Bookmark is a future feature) |
| `CreatedAt` | Instant | NodaTime, consistent with codebase |

---

### New entity: `Report`
User-submitted moderation flags on resources or reviews.

| Column | Type | Notes |
|---|---|---|
| `Id` | Guid PK | |
| `ReporterId` | Guid FK → AppUser | |
| `TargetType` | enum: `Resource`, `Review` | |
| `TargetId` | Guid | ID of reported entity |
| `Reason` | string | |
| `Status` | enum: `Open`, `Resolved`, `Dismissed` | |
| `CreatedAt` | Instant | |

---

## API Endpoints

> Conventions:
> - All responses: `application/json`
> - Auth: `Authorization: Bearer <jwt>`
> - `[auth]` = valid JWT required; `[admin]` = `Admin` role required
> - Pagination: `?page=1&limit=20`

---

### Auth — `AuthController`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register with email + password. Cloudflare Turnstile token required in body. |
| `POST` | `/api/auth/login` | Public | Email + password login. Turnstile token required. Returns access + refresh tokens. |
| `POST` | `/api/auth/refresh` | Public | Exchange refresh token for a new access token. |
| `POST` | `/api/auth/logout` | `[auth]` | Revoke current refresh token. |

---

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | `[auth]` | Get own profile |
| `PATCH` | `/api/users/me` | `[auth]` | Edit own profile (display name, etc.) |
| `GET` | `/api/users/me/preferences` | `[auth]` | Get preferred FacetValues IDs |
| `PUT` | `/api/users/me/preferences` | `[auth]` | Replace full preference set |

---

### Resources — `ResourceController`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/resources` | Public | List published resources. Filter params match `FilterDefinitions.Key` (e.g. `?subject=math&isFree=true`). Supports `?sort=rating\|newest\|random`. |
| `GET` | `/api/resources/recommended` | `[auth]` | Resources matching user's `UserPreference` FacetValues, randomised. |
| `GET` | `/api/resources/{id}` | Public | Single resource with facets, ratings, and image URLs. |
| `POST` | `/api/resources` | `[auth]` | Submit a resource. Status = `PendingReview`. Admins get `Published` directly. |
| `PATCH` | `/api/resources/{id}` | `[auth]` (own) / `[admin]` | Edit resource metadata. |
| `DELETE` | `/api/resources/{id}` | `[admin]` | Archive resource (status → `Archived`). |
| `PATCH` | `/api/resources/{id}/status` | `[admin]` | Approve (`Published`) or reject (`Rejected`) a pending submission. |
| `POST` | `/api/resources/{id}/images` | `[auth]` | Upload image(s) for a resource. |
| `DELETE` | `/api/resources/{id}/images/{imageId}` | `[auth]` (own) / `[admin]` | Soft-delete an image. |

---

### Filters — `FilterController` / `AdminFiltersController`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/filters` | Public | List active `FilterDefinitions` with their `FacetValues`. Used to render the filter UI. |
| `GET` | `/api/filters/{id}` | Public | Single filter with values. |
| `POST` | `/api/admin/filters` | `[admin]` | Create a new filter definition. |
| `PATCH` | `/api/admin/filters/{id}` | `[admin]` | Edit filter (label, kind, sort order, active state). |
| `DELETE` | `/api/admin/filters/{id}` | `[admin]` | Soft-delete filter. |
| `POST` | `/api/admin/filters/{id}/values` | `[admin]` | Add a new facet value to a filter. |
| `PATCH` | `/api/admin/filters/{id}/values/{valueId}` | `[admin]` | Edit a facet value. |
| `DELETE` | `/api/admin/filters/{id}/values/{valueId}` | `[admin]` | Deactivate a facet value. |

---

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/resources/{id}/reviews` | Public | List reviews for a resource. |
| `POST` | `/api/resources/{id}/reviews` | `[auth]` | Create a review (one per user per resource). Updates `ResourceRatings` in the same transaction. |
| `PATCH` | `/api/resources/{id}/reviews/{reviewId}` | `[auth]` (own) | Edit own review. Recomputes `ResourceRatings`. |
| `DELETE` | `/api/resources/{id}/reviews/{reviewId}` | `[auth]` (own) / `[admin]` | Delete review. Recomputes `ResourceRatings`. |
| `POST` | `/api/resources/{id}/reviews/{reviewId}/votes` | `[auth]` | Vote helpful/not helpful on a review (`{ "isHelpful": true }`). |

---

### Discussions

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/resources/{id}/discussions` | Public | List discussions for a resource. |
| `POST` | `/api/resources/{id}/discussions` | `[auth]` | Create a discussion thread. |
| `DELETE` | `/api/resources/{id}/discussions/{discussionId}` | `[auth]` (own) / `[admin]` | Delete a thread (cascades replies). |
| `POST` | `/api/resources/{id}/discussions/{discussionId}/replies` | `[auth]` | Reply to a thread. |
| `DELETE` | `/api/resources/{id}/discussions/{discussionId}/replies/{replyId}` | `[auth]` (own) / `[admin]` | Delete a reply. |

---

### Interactions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/resources/{id}/interactions` | Public | Log an interaction. Body: `{ "type": "Click" \| "Upvote" \| "Downvote", "sessionId": "..." }` |

---

### Reports

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/reports` | `[auth]` | Submit a report. Body: `{ "targetType": "Resource\|Review", "targetId": "...", "reason": "..." }` |
| `GET` | `/api/admin/reports` | `[admin]` | List reports, filterable by `status`. |
| `PATCH` | `/api/admin/reports/{id}` | `[admin]` | Update report status. |

---

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/resources` | `[admin]` | List all resources including non-published. Filter by `?status=PendingReview`. |
| `GET` | `/api/admin/users` | `[admin]` | List users. |
| `PATCH` | `/api/admin/users/{id}/status` | `[admin]` | Set user status (`Suspended`, `Banned`, `Active`) with reason. |

---

### Search — `SearchController`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/search?q=` | Public | Full-text search across resource titles and descriptions. |

---

## Future Features Backlog

- **Bookmarks** — A dedicated `Bookmark` table (`UserId`, `ResourceId`, `CreatedAt`, composite PK) with `GET /api/users/me/bookmarks` and `DELETE /api/users/me/bookmarks/{resourceId}`. `SavesCount` on `Resource` is already a counter for this — it just needs to be incremented/decremented transactionally. *(Confirm before implementing.)*
- **OAuth login** (Google, etc.) — requires removing `modelBuilder.Ignore<IdentityUserLogin<Guid>>()` or adding a custom `ExternalLogin` table
- **Email notifications** on resource approval/rejection — email queue infra already exists via `EmailMessage`
- **Recommendation scoring** using `Interaction` signals
- **Premium filter criteria**

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **`ResourceRatings` staleness** | Wrong star distribution shown | Recompute all `Count1`–`Count5` and `AverageRating` atomically in the same transaction as the review write/delete. Never update them separately. |
| **`Resource.CreatedAtUtc` uses `DateTime` not `Instant`** | Inconsistency across the codebase | Migrate to `Instant` when touching the `Resource` entity for the status field addition. |
| **`Tags` as `List<string>` on Resource** | Hard to filter, no admin control | These are informal quick tags. For admin-managed categorisation, use `FacetValues` instead. Do not filter by `Tags` server-side without an index. |
| **N+1 on resource list** | Slow queries | Always eager-load `ResourceFacetValues → FacetValues → FilterDefinitions` and `Ratings` in list queries. The index on `FacetValuesId` in `ResourceFacetValues` already exists. |
| **`IdentityUserLogin` suppressed** | OAuth cannot be added without schema change | Noted. Do not add OAuth without first deciding on the approach (re-enable built-in or custom table). |
| **Status enum on Resource** | State machine bugs | Enforce valid transitions in the service layer. Invalid transitions return `HTTP 409 Conflict`. |
| **Anonymous interaction tracking** | GDPR exposure | Store only `SessionId` (no PII) for anonymous interactions. Include a consent flag in the UI. |
| **Polymorphic `Report.TargetId`** | No FK integrity | Acceptable for 2 target types. Validate `TargetId` exists in the correct table in the service layer. |
