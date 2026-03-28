import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToasterComponent } from './shared/toaster/toaster.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToasterComponent],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ResourciaFrontend';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    initFlowbite();

    this.route.queryParams.subscribe(params => {
    const accessToken = params['token'];
    if (accessToken) {
      // 1. Save the actual login JWT
      localStorage.setItem('accessToken', accessToken);

      // 2. Remove the token from the URL bar for cleanliness and security
      this.router.navigate([], {
        queryParams: { token: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  });
  }
}
