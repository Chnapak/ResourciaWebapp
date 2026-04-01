/**
 * 404 not found page component.
 */
import { Component } from '@angular/core';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ ButtonComponent ],
  templateUrl: './not-found-404-page.component.html',
  styleUrl: './not-found-404-page.component.scss'
})
/**
 * Displays a friendly "page not found" message.
 */
export class NotFoundPageComponent {
  // No logic needed; template is static.
}
