import { Component, OnInit, inject, signal } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  taskService = inject(TaskService);
  authService = inject(AuthService);

  stats = signal<any>({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalUsers: 0
  });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.taskService.getDashboardStats().subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          this.stats.set(res.data);
        }
      }
    });
  }
}
