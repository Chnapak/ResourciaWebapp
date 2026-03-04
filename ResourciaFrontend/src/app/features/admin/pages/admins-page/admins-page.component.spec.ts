import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminsAdminPageComponent } from './admins-page.component';

describe('AdminsAdminPageComponent', () => {
  let component: AdminsAdminPageComponent;
  let fixture: ComponentFixture<AdminsAdminPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminsAdminPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminsAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
