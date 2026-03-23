import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcePreviewPanelComponent } from './resource-preview-panel.component';

describe('ResourcePreviewPanelComponent', () => {
  let component: ResourcePreviewPanelComponent;
  let fixture: ComponentFixture<ResourcePreviewPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcePreviewPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcePreviewPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
