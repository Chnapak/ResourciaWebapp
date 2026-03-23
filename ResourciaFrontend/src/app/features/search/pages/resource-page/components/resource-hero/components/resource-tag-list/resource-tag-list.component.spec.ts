import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceTagListComponent } from './resource-tag-list.component';

describe('ResourceTagListComponent', () => {
  let component: ResourceTagListComponent;
  let fixture: ComponentFixture<ResourceTagListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceTagListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceTagListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
