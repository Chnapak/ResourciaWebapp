import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltersSectionComponent } from './filters-section.component';
import { FilterKind } from '../../../../../../shared/models/filter-kind';

describe('FiltersSectionComponent', () => {
  let component: FiltersSectionComponent;
  let fixture: ComponentFixture<FiltersSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltersSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltersSectionComponent);
    component = fixture.componentInstance;
    component.filter = {
      key: 'subject',
      label: 'Subject',
      kind: FilterKind.Facet,
      values: [],
      isMulti: true,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
