import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MeInfoModel } from '../../models/me-info';


@Component({
  selector: 'app-default',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './default.component.html',
  styleUrl: './default.component.scss'
})

export class DefaultComponent implements OnInit {
  user: MeInfoModel | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUser();

    this.router.events.subscribe(e => {
    if (e instanceof NavigationEnd) this.loadUser();
  });

  }

  closeWarning() {
    var notification = document.getElementById("warning");
    notification?.classList.add("fade-out");
    setTimeout(() => {
      notification?.remove();
    }, 600);
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



