import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceActionCardComponent } from './resource-action-card.component';

describe('ResourceActionCardComponent', () => {
  let component: ResourceActionCardComponent;
  let fixture: ComponentFixture<ResourceActionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceActionCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceActionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
