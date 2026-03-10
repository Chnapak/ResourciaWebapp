import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchableSingleFacetComponent } from './searchable-single-facet.component';

describe('SearchableSingleFacetComponent', () => {
  let component: SearchableSingleFacetComponent;
  let fixture: ComponentFixture<SearchableSingleFacetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableSingleFacetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchableSingleFacetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
