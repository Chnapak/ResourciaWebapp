import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [],
  templateUrl: './resource-card.component.html',
  styleUrl: './resource-card.component.scss',
})
export class ResourceCardComponent {
  @Input() resource: any;
  @Output() open = new EventEmitter<any>();
  @Output() share = new EventEmitter<any>();

  get hasDescription(): boolean {
    return !!this.resource?.description?.trim();
  }

  get visibleTags(): string[] {
    return this.resource?.tags?.slice(0, 3) ?? [];
  }

}
