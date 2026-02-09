import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteWarningComponent } from './site-warning.component';

describe('SiteWarningComponent', () => {
  let component: SiteWarningComponent;
  let fixture: ComponentFixture<SiteWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteWarningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SiteWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
