import { AfterViewInit, Component, ElementRef, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { HeroBannerComponent } from './components/hero-banner/hero-banner.component';
import { ChapterSectionComponent } from './components/chapter-section/chapter-section.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterOutlet, HeroBannerComponent, ChapterSectionComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  
}

