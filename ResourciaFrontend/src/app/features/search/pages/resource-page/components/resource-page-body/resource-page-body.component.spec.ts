import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcePageBodyComponent } from './resource-page-body.component';

describe('ResourcePageBodyComponent', () => {
  let component: ResourcePageBodyComponent;
  let fixture: ComponentFixture<ResourcePageBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcePageBodyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcePageBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
