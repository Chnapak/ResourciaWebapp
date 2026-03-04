import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltersAdminPageComponent } from './filters-page.component';

describe('FiltersAdminPageComponent', () => {
  let component: FiltersAdminPageComponent;
  let fixture: ComponentFixture<FiltersAdminPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltersAdminPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltersAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
