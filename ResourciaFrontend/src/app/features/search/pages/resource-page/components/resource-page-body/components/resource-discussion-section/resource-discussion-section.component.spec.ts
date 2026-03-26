import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceDiscussionSectionComponent } from './resource-discussion-section.component';

describe('ResourceDiscussionSectionComponent', () => {
  let component: ResourceDiscussionSectionComponent;
  let fixture: ComponentFixture<ResourceDiscussionSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDiscussionSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceDiscussionSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
