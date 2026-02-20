import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreToolbarComponent } from './explore-toolbar.component';

describe('ExploreToolbarComponent', () => {
  let component: ExploreToolbarComponent;
  let fixture: ComponentFixture<ExploreToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExploreToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
