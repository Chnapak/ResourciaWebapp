import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet, NavigationEnd, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { MeInfoModel } from '../../../../shared/models/me-info';

@Component({
  selector: 'app-top-nav',
  imports: [ RouterLink ],
  templateUrl: './app-top-nav.component.html',
  styleUrl: './app-top-nav.component.scss'
})
export class AppTopNavComponent implements OnInit {
  user: MeInfoModel | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUser();

    this.router.events.subscribe(e => {
    if (e instanceof NavigationEnd) this.loadUser();
  });

  }

  loadUser(): void {
    this.authService.getUserInfo().subscribe({
      next: (me) => {
        this.user = me;
        console.log(this.user);
        console.log(this.user.name);
      },
      error: () => {
        this.user = null; // token invalid or not logged in
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}


