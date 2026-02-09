import { Routes } from '@angular/router';
import { HomePageComponent } from './features/public/pages/home-page/home-page.component';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { AppLayoutComponent } from './layouts/app-layout/app-layout.component';
import { RegistrationPageComponent } from './features/auth/pages/registration-page/registration-page.component';
import { TokenValidationPageComponent } from './features/auth/pages/token-validation-page/token-validation-page.component';
import { NotFoundPageComponent } from './features/errors/pages/not-found-404-page/not-found-404-page.component';
import { PrivacyPolicyPageComponent } from './features/public/pages/privacy-policy-page/privacy-policy-page.component';
import { TosPageComponent } from './features/public/pages/tos-page/tos-page.component';
import { ProfilePageComponent } from './features/profile/pages/profile-page/profile-page.component';
import { SearchResultPageComponent } from './features/search/pages/search-result-page/search-result-page.component';
import { AddResourcePageComponent } from './features/search/pages/add-resource-page/add-resource-page.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { canActivateAdminGuard } from './core/guards/admin.guard';
import { FiltersAdminPageComponent } from './features/admin/pages/filters-page/filters-page.component';
import { UsersAdminPageComponent } from './features/admin/pages/users-page/users-page.component';
import { AdminsAdminPageComponent } from './features/admin/pages/admins-page/admins-page.component';
import { ResourcesAdminPageComponent } from './features/admin/pages/resources-page/resources-page.component';

export const routes: Routes = [
    {
        path: '',
        component: AppLayoutComponent,
        children: [
            { path: '', component: HomePageComponent, title: 'Home' },
            { path: 'addresource', component: AddResourcePageComponent, title: "Add Resource"},
            { path: 'login', component: LoginPageComponent, title: 'Login' },
            { path: 'signup', component: RegistrationPageComponent, title: 'Registration'},
            { path: 'confirm-token', component: TokenValidationPageComponent, title: 'Ověření emailu'},
            { path: 'privacy-policy', component: PrivacyPolicyPageComponent, title: 'Privacy Policy'},
            { path: 'profile/:id', component: ProfilePageComponent, title: 'Profile'},
            { path: 'tos', component: TosPageComponent, title: 'Terms of Service'},
            { path: 'search', component: SearchResultPageComponent, title: 'Resources'},
            { path: 'admin', component: AdminLayoutComponent, title: 'Admin Hub', canMatch: [canActivateAdminGuard], 
            children: [
                { path: 'filters', component: FiltersAdminPageComponent},
                { path: 'users', component: UsersAdminPageComponent},
                { path: 'admins', component: AdminsAdminPageComponent},
                { path: 'resources', component: ResourcesAdminPageComponent}
            ]},
            {
                path: '**',
                component: NotFoundPageComponent,
                title: 'Not Found',
            }
            // other routes that share layout
        ]
    }
];
