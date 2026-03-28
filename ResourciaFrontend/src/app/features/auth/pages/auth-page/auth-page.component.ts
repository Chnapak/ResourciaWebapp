import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { RegisterFormComponent } from '../../components/register-form/register-form.component';
import { AuthService } from '../../../../core/auth/auth.service';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [LoginFormComponent, RegisterFormComponent],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  activeTab: AuthMode = 'login';

  ngOnInit(): void {
    const mode = this.route.snapshot.queryParams['mode'] as AuthMode;
    this.activeTab = mode === 'signup' ? 'signup' : 'login';
  }

  setTab(tab: AuthMode): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onLoginSuccess(): void {
    const returnUrl = this.authService.consumeReturnUrl(
      this.route.snapshot.queryParams['returnUrl']
    );
    this.router.navigateByUrl(returnUrl);
  }

  onRegisterSuccess(_email: string): void {
    // Email confirmation screen is shown inside RegisterFormComponent;
    // no navigation needed here.
  }
}
