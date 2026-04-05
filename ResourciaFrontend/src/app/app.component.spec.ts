/**
 * Unit tests for the root AppComponent.
 */
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

/** AppComponent test suite. */
describe('AppComponent', () => {
  /** Sets up the testing module for each spec. */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  /** Verifies the component can be instantiated. */
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  /** Verifies the default title value. */
  it(`should have the 'ResourciaFrontend' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('ResourciaFrontend');
  });

  /** Verifies the title is rendered in the template. */
  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('app-toaster')).toBeTruthy();
  });
});
