import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('accessToken');
  const http = inject(HttpClient);
  const router = inject(Router);

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: any) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      const isExpiredMessage = error.error?.message === 'Invalid or expired token';

      if (isUnauthorized || isExpiredMessage) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          return http.post<any>(`${environment.apiUrl}/api/auth/refresh`, { refreshToken }).pipe(
            switchMap((res: any) => {
              if (res?.success && res.data) {
                localStorage.setItem('accessToken', res.data.accessToken);
                localStorage.setItem('refreshToken', res.data.refreshToken);

                const newAuthReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${res.data.accessToken}`
                  }
                });
                return next(newAuthReq);
              }
              logoutAndRedirect(router);
              return throwError(() => error);
            }),
            catchError((refreshErr) => {
              logoutAndRedirect(router);
              return throwError(() => refreshErr);
            })
          );
        } else {
          logoutAndRedirect(router);
        }
      }
      return throwError(() => error);
    })
  );
};

function logoutAndRedirect(router: Router): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  router.navigate(['/login']);
}
