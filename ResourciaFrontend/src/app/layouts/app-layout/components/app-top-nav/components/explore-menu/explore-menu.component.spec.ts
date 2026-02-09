import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreMenuComponent } from './explore-menu.component';

describe('ExploreMenuComponent', () => {
  let component: ExploreMenuComponent;
  let fixture: ComponentFixture<ExploreMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExploreMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
