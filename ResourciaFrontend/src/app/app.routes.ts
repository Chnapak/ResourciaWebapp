/**
 * Top-level application route definitions and lazy-loaded feature mappings.
 */
import { Routes } from '@angular/router';
import { canActivateAdminGuard } from './core/guards/admin.guard';
import { canActivateGuard } from './core/guards/login.guard';
import { CompleteProfileComponent } from './features/auth/pages/complete-profile/complete-profile.component';

/**
 * Router configuration for public, authenticated, and admin sections.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/app-layout/app-layout.component').then((module) => module.AppLayoutComponent),
    children: [
      {
        path: '',
        title: 'Home',
        loadComponent: () =>
          import('./features/public/pages/home-page/home-page.component').then((module) => module.HomePageComponent)
      },
      {
        path: 'addresource',
        title: 'Add Resource',
        loadComponent: () =>
          import('./features/search/pages/add-resource-page/add-resource-page.component').then((module) => module.AddResourcePageComponent)
      },
      {
        path: 'complete-profile',
        loadComponent: () =>
          import('./features/auth/pages/complete-profile/complete-profile.component').then((module) => module.CompleteProfileComponent)
      },
      {
        path: 'forgot-password',
        title: 'Forgot Password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password-page/forgot-password-page.component').then((module) => module.ForgotPasswordPageComponent)
      },
      {
        path: 'login',
        title: 'Login',
        loadComponent: () =>
          import('./features/auth/pages/login-page/login-page.component').then((module) => module.LoginPageComponent)
      },
      {
        path: 'signup',
        title: 'Registration',
        loadComponent: () =>
          import('./features/auth/pages/registration-page/registration-page.component').then((module) => module.RegistrationPageComponent)
      },
      {
        path: 'confirm-token',
        title: 'Email verification',
        loadComponent: () =>
          import('./features/auth/pages/token-validation-page/token-validation-page.component').then((module) => module.TokenValidationPageComponent)
      },
      {
        path: 'privacy-policy',
        title: 'Privacy Policy',
        loadComponent: () =>
          import('./features/public/pages/privacy-policy-page/privacy-policy-page.component').then((module) => module.PrivacyPolicyPageComponent)
      },
      {
        path: 'profile/edit',
        title: 'Edit Profile',
        canActivate: [canActivateGuard],
        loadComponent: () =>
          import('./features/profile/pages/edit-profile-page/edit-profile-page.component').then((module) => module.EditProfilePageComponent)
      },
      {
        path: 'profile/:username',
        title: 'Profile',
        loadComponent: () =>
          import('./features/profile/pages/profile-page/profile-page.component').then((module) => module.ProfilePageComponent)
      },
      {
        path: 'tos',
        title: 'Terms of Service',
        loadComponent: () =>
          import('./features/public/pages/tos-page/tos-page.component').then((module) => module.TosPageComponent)
      },
      {
        path: 'reset-password',
        title: 'Reset Password',
        loadComponent: () =>
          import('./features/auth/pages/reset-password-page/reset-password-page.component').then((module) => module.ResetPasswordPageComponent)
      },
      {
        path: 'resource/:id',
        canActivate: [canActivateGuard],
        data: { public: true },
        loadComponent: () =>
          import('./features/search/pages/resource-page/resource-page.component').then((module) => module.ResourcePageComponent)
      },
      {
        path: 'search',
        title: 'Resources',
        loadComponent: () =>
          import('./features/search/pages/search-result-page/search-result-page.component').then((module) => module.SearchResultPageComponent)
      },
      {
        path: 'suspended',
        title: 'Account Suspended',
        loadComponent: () =>
          import('./features/auth/pages/suspension-message-page/suspension-message-page.component').then((module) => module.SuspensionMessagePageComponent)
      },
      {
        path: 'admin',
        title: 'Admin Hub',
        canMatch: [canActivateAdminGuard],
        loadComponent: () =>
          import('./layouts/admin-layout/admin-layout.component').then((module) => module.AdminLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'filters' },
          {
            path: 'filters',
            loadComponent: () =>
              import('./features/admin/pages/filters-page/filters-page.component').then((module) => module.FiltersAdminPageComponent)
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./features/admin/pages/users-page/users-page.component').then((module) => module.UsersAdminPageComponent)
          },
          {
            path: 'resources',
            loadComponent: () =>
              import('./features/admin/pages/resources-page/resources-page.component').then((module) => module.ResourcesAdminPageComponent)
          },
          { path: '**', redirectTo: 'filters' }
        ]
      },
      {
        path: '**',
        title: 'Not Found',
        loadComponent: () =>
          import('./features/errors/pages/not-found-404-page/not-found-404-page.component').then((module) => module.NotFoundPageComponent)
      }
    ]
  }
];
