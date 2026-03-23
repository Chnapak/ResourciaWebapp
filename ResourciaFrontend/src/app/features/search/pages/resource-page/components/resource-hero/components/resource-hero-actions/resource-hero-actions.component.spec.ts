import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceHeroActionsComponent } from './resource-hero-actions.component';

describe('ResourceHeroActionsComponent', () => {
  let component: ResourceHeroActionsComponent;
  let fixture: ComponentFixture<ResourceHeroActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceHeroActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceHeroActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
