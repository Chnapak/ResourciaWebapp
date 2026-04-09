import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ExploreMenuComponent } from './components/explore-menu/explore-menu.component';
import { NavSearchComponent } from './components/nav-search/nav-search.component';
import { BrandLogoComponent } from './components/brand-logo/brand-logo.component';
import { AuthLinksComponent } from './components/auth-links/auth-links.component';
import { MeInfoModel } from '../../../../shared/models/me-info';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-top-nav',
  imports: [ ExploreMenuComponent, NavSearchComponent, BrandLogoComponent, AuthLinksComponent, LanguageSwitcherComponent, RouterLink ],
  templateUrl: './app-top-nav.component.html',
  styleUrl: './app-top-nav.component.scss'
})
export class AppTopNavComponent implements OnInit {
  user: MeInfoModel | null = null;
  isMobileMenuOpen = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}


