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
export class AppComponent {
  private readonly tokenReservedPaths = new Set(['/confirm-token', '/reset-password']);
  title = 'ResourciaFrontend';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    initFlowbite();

    this.route.queryParams.subscribe(params => {
<<<<<<< HEAD
    const accessToken = params['token'];
    if (accessToken) {
      // 1. Save the actual login JWT
      localStorage.setItem('accessToken', accessToken);

      // 2. Remove the token from the URL bar for cleanliness and security
=======
      const accessToken = params['token'];
      const currentPath = this.router.url.split('?')[0].toLowerCase();

      if (!this.isAccessTokenParam(accessToken, params['email'], currentPath)) {
        return;
      }

      localStorage.setItem('accessToken', accessToken);

>>>>>>> rescue-mission
      this.router.navigate([], {
        queryParams: { token: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
<<<<<<< HEAD
    }
  });
=======
    });
  }

  private isAccessTokenParam(token: unknown, email: unknown, currentPath: string): token is string {
    if (typeof token !== 'string' || typeof email === 'string' || this.tokenReservedPaths.has(currentPath)) {
      return false;
    }

    return token.split('.').length === 3;
>>>>>>> rescue-mission
  }
}
