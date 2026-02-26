import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // LOGIN
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.page').then(m => m.LoginPage),
  },

  // OPERADOR
  {
    path: 'home',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['OPERADOR'] },
    loadComponent: () =>
      import('./home/home.page').then(m => m.HomePage),
  },
  {
    path: 'checklist',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['OPERADOR'] },
    loadComponent: () =>
      import('./checklist/checklist.page').then(m => m.ChecklistPage),
  },
  {
    path: 'registro-operacion',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['OPERADOR'] },
    loadComponent: () =>
      import('./registro-operacion/registro-operacion.page')
        .then(m => m.RegistroOperacionPage),
  },
  {
    path: 'cierre',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['OPERADOR'] },
    loadComponent: () =>
      import('./cierre/cierre.page').then(m => m.CierrePage),
  },

  // SUPERVISOR
  {
    path: 'bitacoras',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['SUPERVISOR'] },
    loadComponent: () =>
      import('./bitacoras/bitacoras.page')
        .then(m => m.BitacorasPage),
  },

  // ADMIN
  {
    path: 'admin-users',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./admin-users/admin-users.page')
        .then(m => m.AdminUsersPage),
  },

  // WILDCARD
  { path: '**', redirectTo: 'login' },
];
