import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-hub',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  navItems = [
    { label: 'Filters', link: 'filters' },
    { label: 'Users', link: 'users' },
    { label: 'Admins', link: 'admins' },
    { label: 'Resources', link: 'resources' },
    { label: 'Settings', link: 'settings' },
  ];
}
