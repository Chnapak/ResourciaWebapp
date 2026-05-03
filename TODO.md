# TODO

## Recently completed
- [x] Beta invite system (closed-beta registration gating)
- [x] External OAuth flow — Google & Facebook with proper error handling
- [x] Resource audit — full history and revert support
- [x] AI usage indicator on homepage search
- [x] Search engine indexing — `robots.txt` + `sitemap.xml`
- [x] Caddy reverse proxy deployment with www → apex redirect
- [x] EF migrations now run as a separate init container before API starts
- [x] Monetization facet — replaces the legacy `isFree` boolean filter
- [x] Profile photo upload & avatar display
- [x] Cookie-based access tokens (HttpOnly), login lockout, rate limiting
- [x] CI secret scanning via Gitleaks

---

## Bugs / tech debt

- [ ] **EF global query filter warnings** — `AppUser` and `Resource` have global soft-delete filters but their dependent entities (`Comment`, `DiscussionReplies`, `ResourceFilterValues`, etc.) do not. Either add matching filters or make the navigations optional to silence the 10 startup warnings.
- [ ] **`isFree` field still in data model** — the boolean is still on `Resource`, in API models, and in frontend models. Once all resources have a monetization facet value, the field and its DB column can be removed entirely.
- [ ] **`discussions: any[]` in `resource-detail.ts`** — no proper TypeScript type defined for discussions on the resource detail model.
- [ ] **`PendingActionDispatcher` stubs** — `SUBMIT_REVIEW`, `VOTE_REVIEW`, `ADD_COMMENT`, and `SUBMIT_RESOURCE` are all no-ops. They need to be wired to real services so deferred actions replay correctly after login.
- [ ] **`AdminFiltersController` has both PUT and PATCH** — the PATCH endpoint is a leftover and should be removed once PUT covers all update scenarios (there's a `// TODO: Patch instead of Put` comment on it).
- [ ] **Search schema cache not invalidated after migrations** — adding data via migration doesn't clear the Redis schema cache. Newly seeded filters won't appear for up to 1 hour unless an admin manually edits a filter.

---

## Features

- [ ] **Resource verification / moderation queue** — submitted resources go into a pending state and require admin approval before appearing publicly.
- [ ] **User notifications** — notify users when a review they wrote gets a helpful vote, or when a resource they saved is updated.
- [ ] **Full-text search** — currently filter-only; adding a free-text query against title, description, and tags would improve discoverability.
- [ ] **Resource collections / lists** — let users group saved resources into named collections (e.g. "Web Dev Roadmap").
- [ ] **Suggest-a-change review flow** — right now suggestions go directly in; add an admin review step or a diff view before changes are applied.
- [ ] **Pagination on search results** — results are currently limited; proper infinite scroll or page controls are needed as the dataset grows.
- [ ] **Email notifications for beta invites** — when an admin creates an invite, automatically send an email to the invited address with a registration link.
- [ ] **Public user profiles** — currently profiles exist but are not discoverable; add a public listing or search for contributors.
- [ ] **Resource import / bulk add** — allow admins or power users to import multiple resources via CSV or a structured paste.

---

## Infrastructure / ops

- [ ] **Automated DB backups** — no backup strategy is in place for the PostgreSQL container volume on VPS.
- [ ] **Health check endpoint wired to CD** — `/healthz` exists but the CD pipeline only checks it if `VPS_HEALTHCHECK_URL` is set; make it required.
- [ ] **Log aggregation** — container logs are only accessible via `docker logs`; consider shipping to a lightweight sink (Loki, Seq, etc.).
