import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AppTopNavComponent } from './components/app-top-nav/app-top-nav.component';


@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterModule, AppTopNavComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss'
})

export class AppLayoutComponent {
  closeWarning() {
    var notification = document.getElementById("warning");
    notification?.classList.add("fade-out");
    setTimeout(() => {
      notification?.remove();
    }, 600);
  } 
}



