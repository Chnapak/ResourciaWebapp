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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
