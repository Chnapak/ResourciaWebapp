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
    component.thread = {
      id: 'thread-1',
      username: 'alice',
      createdAt: new Date().toISOString(),
      content: 'First post',
      replies: [],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
