import { Component, inject } from '@angular/core';
import { ResourceHeroComponent } from './components/resource-hero/resource-hero.component';
import { ResourcePageBodyComponent } from './components/resource-page-body/resource-page-body.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { Review } from '../../../../shared/models/review';
import { ReviewRequestModel } from '../../../../shared/models/review-request';
import { ResourceDetailModel } from '../../../../shared/models/resource-detail';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '../../../../core/services/resource.service';

@Component({
  selector: 'app-resource-page',
  imports: [ ResourceHeroComponent, ResourcePageBodyComponent ],
  templateUrl: './resource-page.component.html',
  styleUrl: './resource-page.component.scss',
})
export class ResourcePageComponent {
  resourceId: string | null = null;
  resource: ResourceDetailModel | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private resourceService: ResourceService
  ) {}

  ngOnInit() {
    this.resourceId = this.route.snapshot.paramMap.get('id');
    if (!this.resourceId) {
      this.error = 'Resource ID not found.';
      this.loading = false;
      return;
    }

    this.fetchResource(this.resourceId);
  }

  fetchResource(id: string) {
    this.loading = true;
    this.resourceService.getResource(id).subscribe({
      next: (res) => {
        this.resource = res;
        this.loading = false;
        console.log(res)
      },
      error: (err) => {
        console.error('Error fetching resource:', err);
        this.error = 'Failed to load resource.';
        this.loading = false;
      },
    });
  }
}
