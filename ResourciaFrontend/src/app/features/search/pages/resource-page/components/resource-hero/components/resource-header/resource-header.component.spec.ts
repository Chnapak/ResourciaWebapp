import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceHeaderComponent } from './resource-header.component';

describe('ResourceHeaderComponent', () => {
  let component: ResourceHeaderComponent;
  let fixture: ComponentFixture<ResourceHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
