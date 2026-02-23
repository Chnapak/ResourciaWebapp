import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminActionsDropdownComponent } from './admin-actions-dropdown.component';

describe('AdminActionsDropdownComponent', () => {
  let component: AdminActionsDropdownComponent;
  let fixture: ComponentFixture<AdminActionsDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminActionsDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminActionsDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
