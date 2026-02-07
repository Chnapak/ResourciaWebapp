import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { HeroBannerComponent } from './components/hero-banner/hero-banner.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterOutlet, HeroBannerComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

}

