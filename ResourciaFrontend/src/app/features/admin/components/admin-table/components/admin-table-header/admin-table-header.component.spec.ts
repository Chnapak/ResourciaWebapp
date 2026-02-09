import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTableHeaderComponent } from './admin-table-header.component';

describe('AdminTableHeaderComponent', () => {
  let component: AdminTableHeaderComponent;
  let fixture: ComponentFixture<AdminTableHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTableHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTableHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
