import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit {
  private fb = inject(FormBuilder);
  taskService = inject(TaskService);
  userService = inject(UserService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  tasks: any[] = [];
  users: any[] = [];
  loading = false;
  searchControl = new FormControl('');
  searchQuery = '';
  statusFilter = '';
  userTypeFilter = '';

  currentPage = 1;
  totalPages = 1;
  limit = 25;

  sortColumn = 'createdAt';
  sortDirection = 'desc';

  selectedIds = new Set<string>();

  showModal = false;
  editingTask: any = null;

  taskForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    assignedTo: ['', Validators.required],
    dueDate: ['', Validators.required],
    status: ['pending', Validators.required]
  });

  ngOnInit(): void {
    this.loadTasks();
    this.loadUsers();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchQuery = val || '';
      this.currentPage = 1;
      this.loadTasks();
    });
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks({
      page: this.currentPage,
      limit: this.limit,
      search: this.searchQuery,
      status: this.statusFilter,
      sortBy: this.sortColumn,
      sortOrder: this.sortDirection,
      userType: this.userTypeFilter
    }).subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          this.tasks = res.data.tasks || [];
          if (res.data.pagination) {
            this.totalPages = res.data.pagination.totalPages || 1;
            this.currentPage = res.data.pagination.page || 1;
          }
          this.selectedIds.clear();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadUsers(): void {
    if (this.authService.currentUser()?.role !== 'EMPLOYEE') {
      this.userService.getAssignees().subscribe({
        next: (res: any) => {
          if (res?.success && res.data) {
            this.users = res.data || [];
          }
        }
      });
    }
  }

  changeStatusFilter(status: string): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadTasks();
  }

  changeUserTypeFilter(type: string): void {
    this.userTypeFilter = type;
    this.currentPage = 1;
    this.loadTasks();
  }

  changeLimit(limitVal: string | number): void {
    this.limit = Number(limitVal);
    this.currentPage = 1;
    this.loadTasks();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadTasks();
  }

  get sortedTasks(): any[] {
    return this.tasks;
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(): void {
    if (this.selectedIds.size === this.tasks.length) {
      this.selectedIds.clear();
    } else {
      this.tasks.forEach(t => this.selectedIds.add(t._id));
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTasks();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTasks();
    }
  }

  openCreateModal(): void {
    this.editingTask = null;
    const currentUserId = this.authService.currentUser()?._id || '';
    const isEmployee = this.authService.currentUser()?.role === 'EMPLOYEE';
    this.taskForm.reset({
      title: '',
      description: '',
      assignedTo: isEmployee ? currentUserId : '',
      dueDate: '',
      status: 'pending'
    });
    if (isEmployee) {
      this.taskForm.get('assignedTo')?.clearValidators();
    } else {
      this.taskForm.get('assignedTo')?.setValidators([Validators.required]);
    }
    this.taskForm.get('assignedTo')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(task: any): void {
    this.editingTask = task;
    let formattedDate = '';
    if (task.dueDate) {
      formattedDate = new Date(task.dueDate).toISOString().substring(0, 16);
    }
    const currentUserId = this.authService.currentUser()?._id || '';
    const isEmployee = this.authService.currentUser()?.role === 'EMPLOYEE';
    const rawStatus = task.status ? task.status.toLowerCase() : 'pending';
    const editableStatus = rawStatus === 'overdue' ? 'pending' : rawStatus;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      assignedTo: isEmployee ? currentUserId : (task.assignedTo?._id || task.assignedTo),
      dueDate: formattedDate,
      status: editableStatus
    });
    if (isEmployee) {
      this.taskForm.get('assignedTo')?.clearValidators();
    } else {
      this.taskForm.get('assignedTo')?.setValidators([Validators.required]);
    }
    this.taskForm.get('assignedTo')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const val = this.taskForm.value;
    const isEmployee = this.authService.currentUser()?.role === 'EMPLOYEE';
    const currentUserId = this.authService.currentUser()?._id || '';

    const resolvedAssignee = isEmployee ? currentUserId : val.assignedTo;

    if (!isEmployee && !resolvedAssignee) {
      this.toastService.show('Please select a user to assign the task to.', 'danger');
      return;
    }

    const payload: any = {
      title: val.title,
      description: val.description,
      dueDate: val.dueDate,
      status: val.status || 'pending'
    };

    if (resolvedAssignee) {
      payload.assignedTo = resolvedAssignee;
    }

    if (this.editingTask) {
      this.taskService.updateTask(this.editingTask._id, payload).subscribe({
        next: (res: any) => {
          this.toastService.show(res?.message || 'Task updated successfully!');
          this.loadTasks();
          this.closeModal();
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Failed to update task', 'danger');
        }
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: (res: any) => {
          this.toastService.show(res?.message || 'Task created successfully!');
          this.loadTasks();
          this.closeModal();
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Failed to create task', 'danger');
        }
      });
    }
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0) return;
    if (!window.confirm('Are you sure you want to delete the selected task(s)?')) return;
    this.taskService.deleteTasks(Array.from(this.selectedIds)).subscribe({
      next: (res: any) => {
        this.toastService.show(res?.message || 'Tasks deleted successfully!');
        this.loadTasks();
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to delete tasks', 'danger');
      }
    });
  }

  bulkComplete(): void {
    if (this.selectedIds.size === 0) return;
    if (!window.confirm('Are you sure you want to complete the selected task(s)?')) return;
    this.taskService.updateStatus(Array.from(this.selectedIds), 'completed').subscribe({
      next: (res: any) => {
        this.toastService.show(res?.message || 'Tasks marked as completed!');
        this.loadTasks();
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to complete tasks', 'danger');
      }
    });
  }
}
