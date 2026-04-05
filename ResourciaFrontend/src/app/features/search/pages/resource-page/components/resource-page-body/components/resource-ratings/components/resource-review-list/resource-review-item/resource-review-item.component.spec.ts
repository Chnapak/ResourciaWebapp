import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceReviewItemComponent } from './resource-review-item.component';

describe('ResourceReviewItemComponent', () => {
  let component: ResourceReviewItemComponent;
  let fixture: ComponentFixture<ResourceReviewItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceReviewItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceReviewItemComponent);
    component = fixture.componentInstance;
    component.resourceId = 'resource-1';
    component.review = {
      id: 'review-1',
      username: 'reviewer',
      createdAt: new Date().toISOString(),
      rating: 4,
      content: 'Great resource',
      upvotes: 0,
      downvotes: 0,
      userVote: null,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
