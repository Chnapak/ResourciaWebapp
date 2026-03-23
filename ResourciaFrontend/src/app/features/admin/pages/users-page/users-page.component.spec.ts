import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersAdminPageComponent } from './users-page.component';

describe('UsersAdminPageComponent', () => {
  let component: UsersAdminPageComponent;
  let fixture: ComponentFixture<UsersAdminPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersAdminPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
