import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

  constructor(private router: Router) {}

  onSearch() {
    const subject = (document.getElementById('subject') as HTMLSelectElement)?.value;
    const type = (document.getElementById('type') as HTMLSelectElement)?.value;
    const price = (document.getElementById('price') as HTMLSelectElement)?.value;

    this.router.navigate(['/search'], {
        queryParams: {
          subject: subject || null,
          type: type || null,
          price: price || null
      }
    });
  }

}

