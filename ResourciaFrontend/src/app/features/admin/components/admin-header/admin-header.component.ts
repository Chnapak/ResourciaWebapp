/**
 * Admin section header component with a configurable title.
 */
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-header',
  imports: [],
  standalone: true,
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss'
})
/**
 * Displays the page title for admin screens.
 */
export class AdminHeaderComponent {
  /** Title text shown in the header. */
  @Input({ required: true }) title!: string;
}
