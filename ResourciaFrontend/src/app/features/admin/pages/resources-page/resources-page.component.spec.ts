import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesAdminPageComponent } from './resources-page.component';

describe('ResourcesAdminPageComponent', () => {
  let component: ResourcesAdminPageComponent;
  let fixture: ComponentFixture<ResourcesAdminPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesAdminPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcesAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
