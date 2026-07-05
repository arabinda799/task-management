import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  message: string;
  type: 'success' | 'danger';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  show(message: string, type: 'success' | 'danger' = 'success', duration = 3000): void {
    const toast: ToastMessage = { message, type };
    this.toasts.update(t => [...t, toast]);
    setTimeout(() => {
      this.remove(toast);
    }, duration);
  }

  remove(toast: ToastMessage): void {
    this.toasts.update(t => t.filter(x => x !== toast));
  }
}
