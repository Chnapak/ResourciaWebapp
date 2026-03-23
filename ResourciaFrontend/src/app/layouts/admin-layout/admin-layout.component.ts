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
    { label: $localize`Filters`, link: 'filters' },
    { label: $localize`Users`, link: 'users' },
    { label: $localize`Admins`, link: 'admins' },
    { label: $localize`Resources`, link: 'resources' },
    { label: $localize`Settings`, link: 'settings' },
  ];
}
