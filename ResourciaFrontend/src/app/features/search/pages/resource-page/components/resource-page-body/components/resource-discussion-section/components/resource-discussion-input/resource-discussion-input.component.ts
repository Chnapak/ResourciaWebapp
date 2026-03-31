import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { getInitials, getUserGradient } from '../../../../../../../../../../shared/utils/user.utils';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../../../../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { DiscussionService } from '../../../../../../../../../../core/services/discussion.service';

@Component({
  selector: 'app-resource-discussion-input',
  standalone: true,
  imports: [ FormsModule ],
  templateUrl: './resource-discussion-input.component.html',
  styleUrl: './resource-discussion-input.component.scss',
})
export class ResourceDiscussionInputComponent {
  @Input() resourceId!: string;

  text: string = '';

  private auth = inject(AuthService);
  private discussionService = inject(DiscussionService);
  private router = inject(Router);

  ngOnInit() {
    const action = this.auth.peekPendingAction();
    if (!action) return;

    if (action.type === 'setDiscussion') {
      this.auth.runPendingAction();
      this.text = action.payload.text;
    }
  }

  submit() {
    if (!this.text.trim()) return;

    if (!this.auth.requireAuth()) {
      this.auth.setPendingAction({
        type: 'setDiscussion',      // was incorrectly 'setRating'
        payload: { text: this.text }
      });

      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }  // was missing entirely
      });

      return;
    }

    this.discussionService.createThread(this.resourceId, this.text).subscribe({
      next: (res) => {
        this.text = '';
      }
    });
  }
}
