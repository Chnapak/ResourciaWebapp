import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreToolbarComponent } from './explore-toolbar.component';
import { ActivatedRoute } from '@angular/router';

describe('ExploreToolbarComponent', () => {
  let component: ExploreToolbarComponent;
  let fixture: ComponentFixture<ExploreToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreToolbarComponent],
      providers: [ ActivatedRoute ]
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
