import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MeInfoModel } from '../../../../../../shared/models/me-info';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-links',
  imports: [ RouterLink ],
  templateUrl: './auth-links.component.html',
  styleUrl: './auth-links.component.scss'
})
export class AuthLinksComponent {
  @Input() user: MeInfoModel | null = null;
  @Output() logout = new EventEmitter<void>();

  onLogoutClick(): void {
  this.logout.emit();
}
}
