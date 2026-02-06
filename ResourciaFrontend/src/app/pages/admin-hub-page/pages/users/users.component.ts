import { Component, HostListener } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { RouterLink } from '@angular/router';

export type UserStatus = 'Active' | 'Suspended' | 'Banned';

@Component({
  selector: 'app-users',
  imports: [PageHeaderComponent, RouterLink],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})

export class UsersAdminPageComponent {
  
  currentUser: string | null = null;
  currentStatus: UserStatus | null = null;

  menuVisible = false;
  menuTop = 0;
  menuLeft = 0;

  toggleActionMenu(
    event: Event,
    userName: string,
    plan: string,
    status: UserStatus
  ): void {
    event.stopPropagation();

    const mouseEvent = event as MouseEvent;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.menuTop = rect.bottom + 5;
    this.menuLeft = rect.left - 180;

    this.menuVisible = true;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuVisible = false;
  }

}
