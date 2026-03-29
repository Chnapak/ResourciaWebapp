import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ReviewService } from '../../../../../../../../../../core/services/review.service';
import { ResourceDetailModel } from '../../../../../../../../../../shared/models/resource-detail';

import { ResourceReviewListComponent } from './resource-review-list.component';

describe('ResourceReviewListComponent', () => {
  let component: ResourceReviewListComponent;
  let fixture: ComponentFixture<ResourceReviewListComponent>;
  let reviewServiceSpy: jasmine.SpyObj<ReviewService>;

  const buildResource = (): ResourceDetailModel => ({
    id: 'resource-id',
    title: 'W3Schools',
    description: 'Learn to code',
    url: 'https://www.w3schools.com',
    isFree: true,
    year: 1998,
    author: 'W3Schools',
    learningStyle: 'Mixed',
    tags: [],
    facets: [],
    ratings: {
      averageRating: 4.2,
      totalCount: 1,
      count1: 0,
      count2: 0,
      count3: 0,
      count4: 1,
      count5: 0,
    },
    savesCount: 3,
    createdBy: 'admin',
    createdAtUtc: '2025-01-01T00:00:00.000Z',
    updatedAtUtc: '2025-01-02T00:00:00.000Z',
    reviews: [
      {
        id: 'review-1',
        username: 'Ada Lovelace',
        createdAt: '2025-01-03T00:00:00.000Z',
        rating: 5,
        content: 'Very helpful.',
        upvotes: 10,
        downvotes: 1,
        userVote: null,
      },
    ],
    discussions: [],
  });

  beforeEach(async () => {
    reviewServiceSpy = jasmine.createSpyObj<ReviewService>('ReviewService', ['getReviews', 'voteReview']);
    reviewServiceSpy.getReviews.and.returnValue(of({ items: [], totalItems: 0, page: 1, pageSize: 10 }));
    reviewServiceSpy.voteReview.and.returnValue(of({ upvotes: 0, downvotes: 0 }));

    await TestBed.configureTestingModule({
      imports: [ResourceReviewListComponent],
      providers: [
        { provide: ReviewService, useValue: reviewServiceSpy },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceReviewListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps fallback reviews visible when the reviews endpoint fails', () => {
    reviewServiceSpy.getReviews.and.returnValue(throwError(() => new Error('boom')));

    component.resource = buildResource();
    component.ngOnChanges({
      resource: new SimpleChange(null, component.resource, true),
    });
    fixture.detectChanges();

    expect(component.reviews.length).toBe(1);
    expect(component.reviews[0].username).toBe('Ada Lovelace');
    expect(component.totalItems).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.textContent).toContain('1 Reviews');
  });
});
