import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchableMultiFacetComponent } from './searchable-multi-facet.component';

describe('SearchableMultiFacetComponent', () => {
  let component: SearchableMultiFacetComponent;
  let fixture: ComponentFixture<SearchableMultiFacetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableMultiFacetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchableMultiFacetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
