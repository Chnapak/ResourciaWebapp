import { Component } from '@angular/core';

@Component({
  selector: 'site-warning',
  imports: [],
  templateUrl: './site-warning.component.html',
  styleUrl: './site-warning.component.scss'
})
export class SiteWarningComponent {
  closeWarning() {
    var notification = document.getElementById("warning");
    notification?.classList.add("fade-out");
    setTimeout(() => {
      notification?.remove();
    }, 600);
  } 
}
