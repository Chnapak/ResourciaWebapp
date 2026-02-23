import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterSectionComponent } from './chapter-section.component';

describe('ChapterSectionComponent', () => {
  let component: ChapterSectionComponent;
  let fixture: ComponentFixture<ChapterSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChapterSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChapterSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
