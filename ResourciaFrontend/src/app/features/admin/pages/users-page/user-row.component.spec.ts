import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRowComponent } from './user-row.component';

describe('UserRowComponent', () => {
  let component: UserRowComponent;
  let fixture: ComponentFixture<UserRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRowComponent);
    component = fixture.componentInstance;
    component.user = {
      id: 'user-1',
      name: 'Alex Doe',
      handle: 'alex',
      email: 'alex@example.com',
      role: 'admin',
      roleLabel: 'Admin',
      status: 'active',
      resourcesCount: 3,
      lastActiveAt: new Date().toISOString(),
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
