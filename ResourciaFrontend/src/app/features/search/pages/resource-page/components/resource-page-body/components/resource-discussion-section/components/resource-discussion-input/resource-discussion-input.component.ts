import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { getInitials, getUserGradient } from '../../../../../../../../../../shared/utils/user.utils';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-resource-discussion-input',
  standalone: true,
  imports: [ FormsModule ],
  templateUrl: './resource-discussion-input.component.html',
  styleUrl: './resource-discussion-input.component.scss',
})
export class ResourceDiscussionInputComponent {
  @Input() username: string = '';
  @Output() submitMessage = new EventEmitter<string>();

  text: string = '';

  private auth = inject(AuthService)
  
  ngOnInit() {
    const action = this.auth.runPendingAction();

    if (!action) return;

    switch (action.type) {
      case 'setDiscussion':
        this.text = action.payload.text;
        break;
    }
  }

  get initials(): string {
    return this.username ? getInitials(this.username) : '';
  }

  get gradient(): string {
    return this.username ? getUserGradient(this.username) : '#ccc';
  }

  submit() {
    if (!this.text.trim()) return;

    if (!this.auth.requireAuth()) {
      this.auth.setPendingAction({
        type: 'setRating',
        payload: {
          text: this.text
        }
      });
      return;
    }

    this.submitMessage.emit(this.text);
    this.text = '';
  }
}
