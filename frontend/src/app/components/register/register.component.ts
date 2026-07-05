import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('cPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  registerForm = this.fb.nonNullable.group(
    {
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/)
        ]
      ],
      cPassword: ['', Validators.required]
    },
    { validators: passwordMatchValidator }
  );

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { username, email, password, cPassword } = this.registerForm.getRawValue();

    this.authService.register({ username, email, password, cPassword }).subscribe({
      next: (res: any) => {
        this.successMessage = res?.message || 'Registration successful! Wait for administrator approval.';
        this.toastService.show(this.successMessage);
        this.errorMessage = '';
        this.registerForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed';
        this.toastService.show(this.errorMessage, 'danger');
        this.successMessage = '';
      }
    });
  }
}
