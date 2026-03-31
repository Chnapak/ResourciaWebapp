import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { AdminService } from '../../../../core/services/admin.service';
import { ToasterService } from '../../../../shared/toaster/toaster.service';
import { AdminResource } from '../../models/admin-resource.model';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminHeaderComponent, DatePipe],
  templateUrl: './resources-page.component.html',
  styleUrl: './resources-page.component.scss'
})
export class ResourcesAdminPageComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toaster = inject(ToasterService);

  resources: AdminResource[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadResources();
  }

  softDeleteResource(resource: AdminResource): void {
    if (resource.isDeleted) {
      return;
    }

    const confirmed = window.confirm(`Soft delete "${resource.title}"? It will disappear from public search and resource pages.`);
    if (!confirmed) {
      return;
    }

    this.adminService.deleteResource(resource.id).subscribe({
      next: () => {
        this.resources = this.resources.map((currentResource) =>
          currentResource.id === resource.id
            ? {
                ...currentResource,
                isDeleted: true,
                deletedAtUtc: new Date().toISOString(),
              }
            : currentResource
        );
        this.toaster.show('Resource deleted.', 'success');
      },
      error: (err) => {
        console.error('Failed to delete resource', err);
        this.toaster.show('Failed to delete resource.', 'error');
      }
    });
  }

  getDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  private loadResources(): void {
    this.isLoading = true;
    this.error = null;

    this.adminService.getResources().subscribe({
      next: (response) => {
        this.resources = response.items;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load resources', err);
        this.error = 'Failed to load resources.';
        this.isLoading = false;
      }
    });
  }
}
