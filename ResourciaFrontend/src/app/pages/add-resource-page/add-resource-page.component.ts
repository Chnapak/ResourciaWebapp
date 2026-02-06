import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ResourceService } from '../../core/services/resource.service';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-resource-page',
  imports: [ RouterLink ],
  templateUrl: './add-resource-page.component.html',
  styleUrl: './add-resource-page.component.scss'
})
export class AddResourcePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(ResourceService);
  private readonly router = inject(Router);

  
}
