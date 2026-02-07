import { Component, Input } from '@angular/core';

@Component({
  selector: 'site-warning',
  imports: [],
  templateUrl: './site-warning.component.html',
  styleUrl: './site-warning.component.scss'
})
export class SiteWarningComponent {
  @Input() message = '';

  closeWarning() {
    var notification = document.getElementById("warning");
    notification?.classList.add("fade-out");
    setTimeout(() => {
      notification?.remove();
    }, 600);
  } 
}
