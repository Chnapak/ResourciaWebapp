import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceRatingOverviewComponent } from './resource-rating-overview.component';

describe('RatingOverviewComponent', () => {
  let component: ResourceRatingOverviewComponent;
  let fixture: ComponentFixture<ResourceRatingOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceRatingOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceRatingOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
