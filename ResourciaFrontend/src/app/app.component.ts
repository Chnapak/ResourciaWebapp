/**
 * Root application shell that wires routing and boot-time token handling.
 */
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { ToasterComponent } from './shared/toaster/toaster.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToasterComponent],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
/**
 * Hosts the router outlet and handles access-token query param cleanup.
 */
export class AppComponent {
  /** Routes that must keep their token query param intact. */
  private readonly tokenReservedPaths = new Set(['/confirm-token', '/reset-password']);
  /** Display title used by the application shell. */
  title = 'ResourciaFrontend';

  /** Creates the root component with routing dependencies. */
  constructor(private route: ActivatedRoute, private router: Router) {}

  /**
   * Initializes Flowbite and consumes access tokens passed via query params.
   */
  ngOnInit(): void {
    initFlowbite();

    this.route.queryParams.subscribe(params => {
      const accessToken = params['token'];
      const currentPath = this.router.url.split('?')[0].toLowerCase();

      if (!this.isAccessTokenParam(accessToken, params['email'], currentPath)) {
        return;
      }

      localStorage.setItem('accessToken', accessToken);

      this.router.navigate([], {
        queryParams: { token: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    });
  }

  /**
   * Checks whether the query parameter looks like a JWT access token and is safe to consume.
   */
  private isAccessTokenParam(token: unknown, email: unknown, currentPath: string): token is string {
    if (typeof token !== 'string' || typeof email === 'string' || this.tokenReservedPaths.has(currentPath)) {
      return false;
    }

    return token.split('.').length === 3;
  }
}
