import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-hub',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './admin-hub-page.component.html',
  styleUrl: './admin-hub-page.component.scss'
})
export class AdminHubComponent {

}
