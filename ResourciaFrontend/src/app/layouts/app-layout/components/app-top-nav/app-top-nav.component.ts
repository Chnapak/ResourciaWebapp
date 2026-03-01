import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { MeInfoModel } from '../../../../shared/models/me-info';
import { ExploreMenuComponent } from './components/explore-menu/explore-menu.component';
import { NavSearchComponent } from './components/nav-search/nav-search.component';
import { BrandLogoComponent } from './components/brand-logo/brand-logo.component';
import { AuthLinksComponent } from './components/auth-links/auth-links.component';
import { JwtPayloadModel } from '../../../../shared/models/jwt-payload-model';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-top-nav',
  imports: [ ExploreMenuComponent, NavSearchComponent, BrandLogoComponent, AuthLinksComponent ],
  templateUrl: './app-top-nav.component.html',
  styleUrl: './app-top-nav.component.scss'
})
export class AppTopNavComponent implements OnInit {
  user: JwtPayloadModel | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUser();

    this.router.events.subscribe(e => {
    if (e instanceof NavigationEnd) this.loadUser();
  });

  }

  loadUser(): void {
    const token = this.getToken();

    if (!token) {
      this.user = null;
      return;
    }

    try {
      const payload = jwtDecode<JwtPayloadModel>(token);

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp <= now) {
        this.user = null;
        return;
      }

      const roles =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ?? [];

      const isAdmin = roles.includes('Admin');

      console.log('JWT payload:', payload);
      this.user = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        exp: payload.exp,
        isAdmin,
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": roles
      } satisfies JwtPayloadModel;
    } catch (error) {
      this.user = null;
      console.error('Failed to decode JWT:', error);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken'); // or wherever you store it
  }
}


