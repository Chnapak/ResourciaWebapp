import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceRatingInputComponent } from './resource-rating-input.component';

describe('ResourceRatingInputComponent', () => {
  let component: ResourceRatingInputComponent;
  let fixture: ComponentFixture<ResourceRatingInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceRatingInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceRatingInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
