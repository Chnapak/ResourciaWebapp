import { Component, inject, Input, OnChanges, OnInit, SimpleChange, SimpleChanges } from '@angular/core';
import { Review } from '../../../../../../../../../../shared/models/review';
import { ResourceReviewItemComponent } from './resource-review-item/resource-review-item.component';
import { ButtonComponent } from '../../../../../../../../../../shared/ui/button/button.component';
import { ResourceDetailModel } from '../../../../../../../../../../shared/models/resource-detail';
import { ResourceService } from '../../../../../../../../../../core/services/resource.service';

@Component({
  selector: 'app-resource-review-list',
  imports: [ResourceReviewItemComponent, ButtonComponent],
  templateUrl: './resource-review-list.component.html',
  styleUrl: './resource-review-list.component.scss',
})
export class ResourceReviewListComponent implements OnChanges {
  @Input() resource: ResourceDetailModel | null = null

  reviews: Review[] = [];
  page = 1;
  pageSize = 10;
  totalItems = 0;

  private resourceService = inject(ResourceService);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resource'] && this.resource) {
      this.page = 1;
      this.reviews = [];
      this.loadReviews();
    }
  }

  loadReviews() {
    if (!this.resource) return;

    this.resourceService
      .getReviews(this.resource.id, this.page, this.pageSize)
      .subscribe(res => {
        console.log(res)
        this.reviews = res.items;
        this.totalItems = res.totalItems;
      });
  }

  loadMoreReviews(): void {
    if (!this.resource) return;

    if (this.reviews.length >= this.totalItems) return;

    const nextPage = this.page + 1;

    this.resourceService
      .getReviews(this.resource.id, nextPage, this.pageSize)
      .subscribe({
        next: (res) => {
          this.reviews = [...this.reviews, ...res.items];
          this.page = res.page;
          this.totalItems = res.totalItems;
        },
        error: (err) => {
          console.error('Failed to load more reviews', err);
        }
      });
  }
}
