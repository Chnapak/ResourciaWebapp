import { Component } from '@angular/core';
import { ResourceSearchComponent } from '../resource-search/resource-search.component';

/**
 * Hero banner at the top of the public landing page.
 */
@Component({
  selector: 'app-hero-banner',
  imports: [ ResourceSearchComponent ],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.scss'
})
export class HeroBannerComponent {
  // Template-only component for now.
}
