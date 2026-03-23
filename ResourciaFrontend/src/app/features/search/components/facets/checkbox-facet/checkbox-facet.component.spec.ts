import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckboxFacetComponent } from './checkbox-facet.component';

describe('CheckboxFacetComponent', () => {
  let component: CheckboxFacetComponent;
  let fixture: ComponentFixture<CheckboxFacetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxFacetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckboxFacetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
