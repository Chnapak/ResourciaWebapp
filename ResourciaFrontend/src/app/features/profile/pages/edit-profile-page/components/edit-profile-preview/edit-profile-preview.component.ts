import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EditProfileForm } from '../../../../models/edit-profile.model';

@Component({
  selector: 'app-edit-profile-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-profile-preview.component.html',
  styleUrl: './edit-profile-preview.component.scss',
})
export class EditProfilePreviewComponent {
  @Input() preview: Partial<EditProfileForm> | null = null;
  @Input() avatarInitial = '?';
  @Input() interests: string[] = [];
}
