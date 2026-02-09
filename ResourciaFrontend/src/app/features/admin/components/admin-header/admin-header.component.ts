import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-header',
  imports: [],
  standalone: true,
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss'
})
export class AdminHeaderComponent {
  @Input({ required: true }) title!: string;
}