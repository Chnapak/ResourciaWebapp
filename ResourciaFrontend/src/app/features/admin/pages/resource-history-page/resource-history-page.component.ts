import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { AdminService } from '../../../../core/services/admin.service';
import { ToasterService } from '../../../../shared/toaster/toaster.service';
import {
  ResourceAuditEntryDetail,
  ResourceAuditEntryListItem,
  ResourceAuditEntryListResponse
} from '../../models/resource-audit.model';
import { RevertModalComponent } from '../../components/revert-modal/revert-modal.component';
import { formatAuditList, formatAuditValue } from '../../../../shared/utils/resource-audit-format';

@Component({
  selector: 'app-resource-history-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminHeaderComponent, DatePipe, RevertModalComponent],
  templateUrl: './resource-history-page.component.html',
  styleUrl: './resource-history-page.component.scss'
})
export class ResourceHistoryPageComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly toaster = inject(ToasterService);

  resourceId: string | null = null;
  resourceTitle: string | null = null;
  isDeleted = false;

  entries: ResourceAuditEntryListItem[] = [];
  selectedEntry: ResourceAuditEntryListItem | null = null;
  selectedDetail: ResourceAuditEntryDetail | null = null;

  isLoading = true;
  isDetailLoading = false;
  isRevertSubmitting = false;
  error: string | null = null;

  showRevertModal = false;

  ngOnInit(): void {
    this.resourceId = this.route.snapshot.paramMap.get('id');
    if (!this.resourceId) {
      this.error = 'Resource ID not found.';
      this.isLoading = false;
      return;
    }

    this.loadAudit();
  }

  loadAudit(): void {
    if (!this.resourceId) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.adminService.getResourceAudit(this.resourceId).subscribe({
      next: (response: ResourceAuditEntryListResponse) => {
        this.entries = response.items;
        this.resourceTitle = response.resourceTitle ?? null;
        this.isDeleted = response.isDeleted;
        this.isLoading = false;

        if (this.entries.length > 0) {
          this.selectEntry(this.entries[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load audit history', err);
        this.error = 'Failed to load audit history.';
        this.isLoading = false;
      }
    });
  }

  selectEntry(entry: ResourceAuditEntryListItem): void {
    if (!this.resourceId) {
      return;
    }

    this.selectedEntry = entry;
    this.selectedDetail = null;
    this.isDetailLoading = true;

    this.adminService.getResourceAuditEntry(this.resourceId, entry.id).subscribe({
      next: (detail) => {
        this.selectedDetail = detail;
        this.isDetailLoading = false;
      },
      error: (err) => {
        console.error('Failed to load audit entry', err);
        this.toaster.show('Failed to load audit entry details.', 'error');
        this.isDetailLoading = false;
      }
    });
  }

  openRevertModal(): void {
    if (!this.selectedEntry || !this.selectedDetail) {
      return;
    }

    this.showRevertModal = true;
  }

  closeRevertModal(): void {
    this.showRevertModal = false;
  }

  confirmRevert(reason: string): void {
    if (!this.resourceId || !this.selectedEntry) {
      return;
    }

    this.isRevertSubmitting = true;

    this.adminService
      .revertResource(this.resourceId, { auditId: this.selectedEntry.id, reason })
      .subscribe({
        next: () => {
          this.isRevertSubmitting = false;
          this.showRevertModal = false;
          this.toaster.show('Resource reverted.', 'success');
          this.loadAudit();
        },
        error: (err) => {
          console.error('Failed to revert resource', err);
          this.isRevertSubmitting = false;
          this.toaster.show('Failed to revert resource.', 'error');
        }
      });
  }

  formatActor(entry: ResourceAuditEntryListItem): string {
    if (entry.actorDisplayName) {
      return entry.actorDisplayName;
    }

    return entry.source === 'system' ? 'System' : 'Unknown';
  }

  getActionLabel(action: string): string {
    switch (action) {
      case 'softDelete':
        return 'Soft Delete';
      case 'imageAdd':
        return 'Image Added';
      case 'imageDelete':
        return 'Image Removed';
      case 'filtersUpdate':
        return 'Filters Updated';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
  }

  formatValue(value: unknown): string {
    return formatAuditValue(value);
  }

  formatList(values: string[] | null | undefined): string {
    return formatAuditList(values);
  }
}
