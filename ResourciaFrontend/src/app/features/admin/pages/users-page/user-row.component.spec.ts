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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
