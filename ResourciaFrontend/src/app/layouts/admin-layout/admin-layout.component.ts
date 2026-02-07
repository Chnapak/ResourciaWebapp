import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-hub',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './admin-layout-page.component.html',
  styleUrl: './admin-layout-page.component.scss'
})
export class AdminLayoutComponent {

}
