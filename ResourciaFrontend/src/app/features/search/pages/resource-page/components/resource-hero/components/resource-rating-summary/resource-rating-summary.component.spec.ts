import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceRatingSummaryComponent } from './resource-rating-summary.component';

describe('ResourceRatingSummaryComponent', () => {
  let component: ResourceRatingSummaryComponent;
  let fixture: ComponentFixture<ResourceRatingSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceRatingSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceRatingSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
