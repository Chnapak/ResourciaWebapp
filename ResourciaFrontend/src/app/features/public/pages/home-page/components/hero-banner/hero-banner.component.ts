import { Component } from '@angular/core';
import { ResourceSearchComponent } from '../resource-search/resource-search.component';

@Component({
  selector: 'app-hero-banner',
  imports: [ ResourceSearchComponent ],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.scss'
})
export class HeroBannerComponent {
  
}
