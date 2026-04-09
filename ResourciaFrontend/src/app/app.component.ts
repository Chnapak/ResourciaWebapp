/**
 * Root application shell that wires routing and boot-time URL cleanup.
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
 * Hosts the router outlet and removes sensitive query params when needed.
 */
export class AppComponent {
  /** Routes that must keep their token query params intact. */
  private readonly tokenReservedPaths = new Set(['/confirm-token', '/reset-password']);
  /** Display title used by the application shell. */
  title = 'ResourciaFrontend';

  /** Creates the root component with routing dependencies. */
  constructor(private route: ActivatedRoute, private router: Router) {}

  /**
   * Initializes Flowbite and removes stray token params from non-auth routes.
   */
  ngOnInit(): void {
    initFlowbite();

    this.route.queryParams.subscribe(params => {
      const accessToken = params['token'];
      const currentPath = this.router.url.split('?')[0].toLowerCase();

      if (typeof accessToken !== 'string' || this.tokenReservedPaths.has(currentPath)) {
        return;
      }

      this.router.navigate([], {
        queryParams: { token: null, email: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    });
  }
}
