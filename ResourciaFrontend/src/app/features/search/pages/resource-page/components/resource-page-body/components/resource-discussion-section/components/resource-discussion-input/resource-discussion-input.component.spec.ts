import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceDiscussionInputComponent } from './resource-discussion-input.component';

describe('ResourceDiscussionInputComponent', () => {
  let component: ResourceDiscussionInputComponent;
  let fixture: ComponentFixture<ResourceDiscussionInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDiscussionInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceDiscussionInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
