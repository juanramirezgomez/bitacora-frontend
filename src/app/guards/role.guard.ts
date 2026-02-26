
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

const goByRole = async (router: Router, rol: string) => {
  if (rol === 'ADMIN') return router.navigateByUrl('/admin-users', { replaceUrl: true });
  if (rol === 'SUPERVISOR') return router.navigateByUrl('/bitacoras', { replaceUrl: true });
  return router.navigateByUrl('/home', { replaceUrl: true }); // OPERADOR default
};

export const roleGuard = (allowed: Array<'ADMIN' | 'OPERADOR' | 'SUPERVISOR'>): CanActivateFn => {
  return async () => {
    const storage = inject(Storage);
    const router = inject(Router);

    await storage.create();
    const session = await storage.get('session');

    const token = session?.token;
    const rol = String(session?.user?.rol || '').toUpperCase() as any;

    if (!token) {
      await router.navigateByUrl('/login', { replaceUrl: true });
      return false;
    }

    if (!allowed.includes(rol)) {
      await goByRole(router, rol);
      return false;
    }

    return true;
  };
};
