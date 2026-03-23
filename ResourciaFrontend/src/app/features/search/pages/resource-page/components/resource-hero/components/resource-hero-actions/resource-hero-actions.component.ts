import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../../../../../../shared/ui/button/button.component';
import { ToasterService } from '../../../../../../../../shared/toaster/toaster.service';

@Component({
  selector: 'app-resource-hero-actions',
  imports: [ButtonComponent],
  templateUrl: './resource-hero-actions.component.html',
  styleUrl: './resource-hero-actions.component.scss',
})
export class ResourceHeroActionsComponent {
  private toaster = inject(ToasterService)

  

  handleFavorite(input: any): void {
    this.toaster.show("Feature not avaible yet", "info")
  }
}
