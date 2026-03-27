import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceDiscussionReplyComponent } from './resource-discussion-reply.component';

describe('ResourceDiscussionReplyComponent', () => {
  let component: ResourceDiscussionReplyComponent;
  let fixture: ComponentFixture<ResourceDiscussionReplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDiscussionReplyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceDiscussionReplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
