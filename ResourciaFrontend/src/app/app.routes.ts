import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { DefaultComponent } from './layouts/default/default.component';

export const routes: Routes = [
    {
        path: '',
        component: DefaultComponent,
        children: [
            { path: '', component: HomePageComponent, title: 'Home' },
            { path: 'login', component: LoginPageComponent, title: 'Login' }
            // other routes that share layout
        ]
    }
];
