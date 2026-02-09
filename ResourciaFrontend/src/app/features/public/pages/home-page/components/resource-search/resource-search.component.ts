import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resource-search',
  imports: [],
  templateUrl: './resource-search.component.html',
  styleUrl: './resource-search.component.scss'
})
export class ResourceSearchComponent {
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
