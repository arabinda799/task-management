import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  userService = inject(UserService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  users: any[] = [];
  selectedIds = new Set<string>();
  loading = false;

  searchControl = new FormControl('');
  searchQuery = '';
  userTypeFilter = '';

  currentPage = 1;
  totalPages = 1;
  limit = 25;

  sortColumn = 'createdAt';
  sortDirection = 'desc';

  showModal = false;
  editingUser: any = null;

  userForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['EMPLOYEE', Validators.required],
    reportsTo: [''],
    transferReportsTo: ['']
  });

  ngOnInit(): void {
    this.loadUsers();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchQuery = val || '';
      this.currentPage = 1;
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers({
      page: this.currentPage,
      limit: this.limit,
      search: this.searchQuery,
      userType: this.userTypeFilter,
      sortBy: this.sortColumn,
      sortOrder: this.sortDirection
    }).subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          this.users = res.data.users || [];
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

  changeLimit(limitVal: string | number): void {
    this.limit = Number(limitVal);
    this.currentPage = 1;
    this.loadUsers();
  }

  changeUserTypeFilter(type: string): void {
    this.userTypeFilter = type;
    this.currentPage = 1;
    this.loadUsers();
  }

  get teamLeads(): any[] {
    return this.users.filter(u => u.role === 'TEAMLEAD');
  }

  getOtherTeamLeads(excludeId: string): any[] {
    return this.users.filter(u => u.role === 'TEAMLEAD' && u._id !== excludeId);
  }

  hasReports(userId: string): boolean {
    return this.users.some(u => u.reportsTo?._id === userId);
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadUsers();
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(): void {
    if (this.selectedIds.size === this.users.length) {
      this.selectedIds.clear();
    } else {
      this.users.forEach(u => this.selectedIds.add(u._id));
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  openCreateModal(): void {
    this.editingUser = null;
    this.userForm.reset({
      username: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      reportsTo: '',
      transferReportsTo: ''
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(user: any): void {
    this.editingUser = user;
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      role: user.role,
      reportsTo: user.reportsTo?._id || user.reportsTo || '',
      transferReportsTo: ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const val = this.userForm.value;
    const payload: any = {
      username: val.username,
      email: val.email,
      role: val.role,
      reportsTo: val.reportsTo || null
    };

    if (this.editingUser) {
      if (this.editingUser.role === 'TEAMLEAD' && val.role === 'EMPLOYEE' && this.hasReports(this.editingUser._id)) {
        const targetTL = val.transferReportsTo;
        if (!targetTL) {
          this.toastService.show('Downgrading requires selecting another Team Lead to transfer active reports.', 'danger');
          return;
        }
        this.userService.transferReports(this.editingUser._id, targetTL).subscribe({
          next: () => {
            this.proceedUpdate(payload);
          },
          error: (err) => {
            this.toastService.show(err.error?.message || 'Failed to transfer reports', 'danger');
          }
        });
      } else {
        this.proceedUpdate(payload);
      }
    } else {
      payload.password = val.password;
      this.userService.createUser(payload).subscribe({
        next: (res: any) => {
          this.toastService.show(res?.message || 'User created successfully!');
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Failed to create user', 'danger');
        }
      });
    }
  }

  proceedUpdate(payload: any): void {
    this.userService.updateUser(this.editingUser._id, payload).subscribe({
      next: (res: any) => {
        this.toastService.show(res?.message || 'User updated successfully!');
        this.loadUsers();
        this.closeModal();
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to update user', 'danger');
      }
    });
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0) return;
    if (!window.confirm('Are you sure you want to delete the selected user(s)?')) return;
    this.userService.deleteUsers(Array.from(this.selectedIds)).subscribe({
      next: (res: any) => {
        this.toastService.show(res?.message || 'Users deleted successfully!');
        this.loadUsers();
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to delete users', 'danger');
      }
    });
  }
}
