import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourceAuditEntryDetail } from '../../models/resource-audit.model';
import { formatAuditList, formatAuditValue } from '../../../../shared/utils/resource-audit-format';

@Component({
  selector: 'app-revert-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revert-modal.component.html',
  styleUrl: './revert-modal.component.scss'
})
export class RevertModalComponent {
  @Input() entry: ResourceAuditEntryDetail | null = null;
  @Input() isSubmitting = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();

  reason = '';
  touched = false;

  submit(): void {
    this.touched = true;
    if (!this.reason.trim()) {
      return;
    }

    this.confirm.emit(this.reason.trim());
  }

  get showReasonError(): boolean {
    return this.touched && !this.reason.trim();
  }

  formatValue(value: unknown): string {
    return formatAuditValue(value);
  }

  formatList(values: string[] | null | undefined): string {
    return formatAuditList(values);
  }
}
