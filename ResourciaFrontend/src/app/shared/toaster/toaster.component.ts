import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Toast } from './toaster.model';
import { ToasterService } from './toaster.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toaster',
  imports: [ CommonModule ],
  templateUrl: './toaster.component.html',
  styleUrl: './toaster.component.scss',
})
export class ToasterComponent {
  toasts$: Observable<Toast[]>;

  constructor(private toastService: ToasterService) {
    this.toasts$ = this.toastService.toasts$;
  }

  remove(id: number) {
    this.toastService.remove(id);
  }
}
