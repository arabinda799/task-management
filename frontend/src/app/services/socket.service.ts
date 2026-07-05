import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket?: Socket;
  notifications = signal<any[]>([]);

  connect(): void {
    const token = localStorage.getItem('accessToken');
    if (!token || this.socket) return;

    this.socket = io('http://localhost:5000', {
      query: { token }
    });

    this.socket.on('task_updated', (data: any) => {
      this.notifications.update(n => [data, ...n]);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }
}
