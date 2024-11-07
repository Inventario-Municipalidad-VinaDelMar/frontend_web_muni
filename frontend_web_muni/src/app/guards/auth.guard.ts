import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/Sockets/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (!authService.getUser()) {
      authService.refreshToken().subscribe(() => {
        // El token y el usuario están listos
      });
    }
    return true; // Permite el acceso si está autenticado
  } else {
    router.navigate(['/login']); // Redirige al login si no hay token
    return false;
  }
};
