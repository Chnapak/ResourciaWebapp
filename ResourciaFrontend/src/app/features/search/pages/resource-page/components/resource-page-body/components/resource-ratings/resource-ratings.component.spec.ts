import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceRatingsComponent } from './resource-ratings.component';

describe('ResourceRatingsComponent', () => {
  let component: ResourceRatingsComponent;
  let fixture: ComponentFixture<ResourceRatingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceRatingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceRatingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
