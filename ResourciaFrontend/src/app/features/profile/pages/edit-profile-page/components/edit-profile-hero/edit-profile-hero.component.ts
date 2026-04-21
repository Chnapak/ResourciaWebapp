import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-edit-profile-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './edit-profile-hero.component.html',
  styleUrl: './edit-profile-hero.component.scss',
})
export class EditProfileHeroComponent {
  @Input() originalProfileIdentifier = '';
  @Input() username: string | null = null;
  @Input() avatarUrl: string | null = null;
  @Input() avatarInitial = '?';
  @Input() avatarUploading = false;
  @Input() avatarError: string | null = null;
  @Input() avatarSuccess: string | null = null;

  @Output() avatarSelected = new EventEmitter<Event>();
  @Output() removeAvatar = new EventEmitter<void>();
}
