import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceReviewListComponent } from './resource-review-list.component';

describe('ResourceReviewListComponent', () => {
  let component: ResourceReviewListComponent;
  let fixture: ComponentFixture<ResourceReviewListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceReviewListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceReviewListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
