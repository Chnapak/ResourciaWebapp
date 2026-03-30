// ============================================================
// profile.routes.ts  — UPDATED
// ============================================================
// IMPORTANT: Place the 'edit' route BEFORE the ':username' wildcard
// so that navigating to /profile/edit does not get caught by
// the dynamic segment.
// ============================================================

import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  // ✅ Static route — must come BEFORE :username
  {
    path: 'edit',
    loadComponent: () =>
      import('./pages/edit-profile-page/edit-profile-page.component').then(
        m => m.EditProfilePageComponent
      ),
    // Add an auth guard here once you have one:
    // canActivate: [AuthGuard],
  },

  // Dynamic route — catches /profile/:username
  {
    path: ':username',
    loadComponent: () =>
      import('./pages/profile-page/profile-page.component').then(
        m => m.ProfilePageComponent
      ),
  },

  // Default fallback
  { path: '', redirectTo: '/', pathMatch: 'full' },
];

// ============================================================
// In your app.routes.ts (or wherever profile feature is wired),
// make sure the profile feature is registered like:
//
//   {
//     path: 'profile',
//     loadChildren: () =>
//       import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
//   },
//
// This gives you:
//   /profile/edit        → EditProfilePageComponent  ✅
//   /profile/:username   → ProfilePageComponent      ✅
// ============================================================
