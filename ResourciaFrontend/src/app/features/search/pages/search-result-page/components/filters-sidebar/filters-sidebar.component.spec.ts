import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltersSidebarComponent } from './filters-sidebar.component';

describe('FiltersSidebarComponent', () => {
  let component: FiltersSidebarComponent;
  let fixture: ComponentFixture<FiltersSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltersSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltersSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
