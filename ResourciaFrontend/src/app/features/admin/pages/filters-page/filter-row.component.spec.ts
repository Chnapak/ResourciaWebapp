import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterRowComponent } from './filter-row.component';
import { FilterKind } from '../../../../shared/models/filter-kind';

describe('FilterRowComponent', () => {
  let component: FilterRowComponent;
  let fixture: ComponentFixture<FilterRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterRowComponent);
    component = fixture.componentInstance;
    component.filter = {
      id: 'filter-1',
      key: 'subject',
      label: 'Subject',
      description: null,
      kind: FilterKind.Facet,
      isMulti: true,
      isActive: true,
      sortOrder: 1,
      resourceField: null,
      facetValues: [],
      resourceCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      lastChangeAt: new Date().toISOString(),
      modifiedBy: null,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
