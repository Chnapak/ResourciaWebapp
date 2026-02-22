import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AppTopNavComponent } from './components/app-top-nav/app-top-nav.component';
import { SiteWarningComponent } from './components/site-warning/site-warning.component';
import { AppFooterComponent } from './components/app-footer/app-footer.component';


@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterModule, AppTopNavComponent, SiteWarningComponent, AppFooterComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss'
})

export class AppLayoutComponent {

}



