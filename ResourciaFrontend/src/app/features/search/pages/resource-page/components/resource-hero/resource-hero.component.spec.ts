import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceHeroComponent } from './resource-hero.component';

describe('ResourceHeroComponent', () => {
  let component: ResourceHeroComponent;
  let fixture: ComponentFixture<ResourceHeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceHeroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceHeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
