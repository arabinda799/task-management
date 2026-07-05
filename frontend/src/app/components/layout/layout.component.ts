import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  socketService = inject(SocketService);
  private router = inject(Router);

  notificationsCount = computed(() => this.socketService.notifications().length);
  sidebarExpanded = signal(false);

  ngOnInit(): void {
    this.socketService.connect();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  toggleSidebar(): void {
    this.sidebarExpanded.set(!this.sidebarExpanded());
  }

  logout(): void {
    if (window.confirm('Are you sure you want to logout?')) {
      this.socketService.disconnect();
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
