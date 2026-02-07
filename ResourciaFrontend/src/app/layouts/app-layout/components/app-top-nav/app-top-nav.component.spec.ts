import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppTopNavComponent } from './app-top-nav.component';

describe('AppTopNavComponent', () => {
  let component: AppTopNavComponent;
  let fixture: ComponentFixture<AppTopNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppTopNavComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppTopNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
