import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { DefaultComponent } from './layouts/default/default.component';
import { RegistrationPageComponent } from './pages/registration-page/registration-page.component';
import { TokenValidationPageComponent } from './pages/token-validation-page/token-validation-page.component';
import { NotFoundPageComponent } from './pages/errors/not-found-page/not-found-page.component';
import { PrivacyPolicyPageComponent } from './pages/privacy-policy-page/privacy-policy-page.component';
import { TosPageComponent } from './pages/tos-page/tos-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { SearchResultPageComponent } from './pages/search-result-page/search-result-page.component';
import { AddResourcePageComponent } from './pages/add-resource-page/add-resource-page.component';
import { AdminHubComponent } from './pages/admin-hub-page/admin-hub-page.component';
import { canActivateAdminGuard } from './components/guards/admin.guard';
import { FiltersAdminPageComponent } from './pages/admin-hub-page/pages/filters/filters.component';
import { UsersAdminPageComponent } from './pages/admin-hub-page/pages/users/users.component';

export const routes: Routes = [
    {
        path: '',
        component: DefaultComponent,
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
            { path: 'admin', component: AdminHubComponent, title: 'Admin Hub', canMatch: [canActivateAdminGuard], 
            children: [
                { path: 'filters', component: FiltersAdminPageComponent},
                { path: 'users', component: UsersAdminPageComponent}
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
