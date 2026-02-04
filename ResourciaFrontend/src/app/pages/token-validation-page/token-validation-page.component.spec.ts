import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenValidationPageComponent } from './token-validation-page.component';

describe('TokenValidationPageComponent', () => {
  let component: TokenValidationPageComponent;
  let fixture: ComponentFixture<TokenValidationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenValidationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TokenValidationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
