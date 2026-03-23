import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [ButtonComponent, CommonModule],
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

  getDomain(url: string): string {
    try {
      const formatted = url.startsWith('http') ? url : `https://${url}`;
      return new URL(formatted).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
}
