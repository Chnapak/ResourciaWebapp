import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuspensionMessagePageComponent } from './suspension-message-page.component';

describe('SuspensionMessagePageComponent', () => {
  let component: SuspensionMessagePageComponent;
  let fixture: ComponentFixture<SuspensionMessagePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuspensionMessagePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuspensionMessagePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
