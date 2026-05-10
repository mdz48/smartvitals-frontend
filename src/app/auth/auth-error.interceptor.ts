import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const messageService = inject(MessageService);

  return next(req).pipe(
    tap({
      error: (error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          messageService.add({
            severity: 'warn',
            summary: 'session expired',
            detail: 'Please log in again to continue.',
          });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.navigate(['/login']);
        }
      }
    })
  );
};
