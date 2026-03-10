import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RadioFacetComponent } from './radio-facet.component';

describe('RadioFacetComponent', () => {
  let component: RadioFacetComponent;
  let fixture: ComponentFixture<RadioFacetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadioFacetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RadioFacetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
