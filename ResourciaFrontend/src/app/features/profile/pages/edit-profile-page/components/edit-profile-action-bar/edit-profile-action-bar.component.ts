import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SaveStatus } from '../../../../models/edit-profile.model';

@Component({
  selector: 'app-edit-profile-action-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-profile-action-bar.component.html',
  styleUrl: './edit-profile-action-bar.component.scss',
})
export class EditProfileActionBarComponent {
  @Input() isDirty = false;
  @Input() isSaving = false;
  @Input() isSaved = false;
  @Input() isError = false;
  @Input() saveStatus: SaveStatus = 'idle';
  @Input() saveMessage: string | null = null;
  @Input() isDeletingAccount = false;
  @Input() formInvalid = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
}
