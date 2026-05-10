import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica si el usuario está logueado
  if (authService.isLogged()) {
    return true;
  }

  // Si no está logueado, redirige al login
  router.navigate(['/']);
  return false;
};
