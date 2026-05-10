import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();

    if (user && user.role === 'admin') {
        return true;
    }

    // Redirigir al home si no es admin
    router.navigate(['/home']);
    return false;
};
