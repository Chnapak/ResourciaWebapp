import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceDescriptionCardComponent } from './resource-description-card.component';

describe('ResourceDescriptionCardComponent', () => {
  let component: ResourceDescriptionCardComponent;
  let fixture: ComponentFixture<ResourceDescriptionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDescriptionCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceDescriptionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
