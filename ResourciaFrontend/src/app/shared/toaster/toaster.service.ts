import { Injectable } from '@angular/core';
import { Toast } from './toaster.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToasterService {
  private toasts: Toast[] = [];
  private toastSubject = new BehaviorSubject<Toast[]>([]);

  toasts$ = this.toastSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const toast: Toast = {
      id: Date.now(),
      message,
      type
    };

    this.toasts.push(toast);
    this.toastSubject.next(this.toasts);

    setTimeout(() => this.remove(toast.id), 4000);
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastSubject.next(this.toasts);
  }
}
