import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceDiscussionThreadComponent } from './resource-discussion-thread.component';

describe('ResourceDiscussionThreadComponent', () => {
  let component: ResourceDiscussionThreadComponent;
  let fixture: ComponentFixture<ResourceDiscussionThreadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDiscussionThreadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceDiscussionThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
