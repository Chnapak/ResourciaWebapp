# Edit Profile — Design & Implementation Notes

## Files delivered

| File | Purpose |
|------|---------|
| `edit-profile-page.component.ts` | Standalone page component |
| `edit-profile-page.component.html` | Template |
| `edit-profile-page.component.scss` | Scoped styles |
| `models/edit-profile.model.ts` | Typed form model + field metadata |
| `services/edit-profile.service.ts` | Save seam (stubbed, ready to wire) |
| `profile.routes.ts` | Updated routes (edit before :username) |

---

## Design decisions

### Visual language
Stays inside the Resourcia world established by the public profile page:
- Same blue gradient hero (`#0d1f6b → #1a3aad → #2952d9`)
- Same white rounded cards, soft `box-shadow`, and border-radius: 14px
- Typography mirrors the existing page — bold section headings, muted helpers
- No purple anywhere

The hero section mirrors the public profile hero but reframes it as *editing mode*:
a breadcrumb back to the profile, the avatar with a subtle edit badge, and a clear
"Edit Your Profile" heading. Same atmosphere, different intent.

### Two-column layout
- **Left**: form organised into three logical cards — Identity (name + username), 
  About (bio/location/website), Interests
- **Right**: sticky preview card that mirrors the mini-profile hero in real time
  (live as you type, no save required)
- On mobile (≤860px) the preview card collapses to the top so users see the 
  effect immediately before editing

### Sticky action bar
Fixed to the bottom of the viewport so Save/Cancel is always reachable on long
screens without scrolling. Displays a live status dot: idle / saving / saved / error.
After a successful save the user is automatically routed back to their public profile.

### Field-level backend badges
Each field label carries a small badge:
- **Live** (green) — field is actually persisted today
- **Coming soon** (blue) — UI + model ready, backend endpoint pending

This is honest with the user and clear for future devs.

---

## Backend reality today vs. future

### ✅ Fields backed by backend today
| Field | Notes |
|-------|-------|
| `displayName` | Maps to `userName` on the auth account |
| `username` | Set via `POST /api/Auth/CompleteExternalLogin`; full edit flow TBD |

### 🔜 Future fields (model + UI ready, no endpoint yet)
| Field | What's needed |
|-------|--------------|
| `bio` | New column on user/profile table + PATCH endpoint |
| `location` | Same |
| `website` | Same |
| `interests` | Already rendered on profile page; needs settable API |
| `avatarUrl` | Needs file upload endpoint (S3/blob storage) |

The `EditProfileService.save()` method contains a clearly commented stub and the 
exact HTTP call shape ready to uncomment once `PATCH /api/Profile` exists.

---

## Wiring save to backend

When the backend is ready, open `edit-profile.service.ts` and replace the stub 
with the real call (commented template already in place):

```ts
return this.http.patch<void>(`${this.apiBase}/Profile`, {
  displayName: form.displayName,
  username:    form.username,
  bio:         form.bio,
  location:    form.location,
  website:     form.website,
  interests:   form.interests,
})
```

No changes to the component or template are needed.

---

## Route safety

The route file places `edit` **before** `:username` so Angular's router matches
`/profile/edit` as a static segment, not a username. This is the only required
change to the routing config. The existing `/profile/:username` route is untouched.
