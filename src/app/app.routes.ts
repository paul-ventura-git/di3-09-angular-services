import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'value-changes',
    loadComponent: () => import('./features/components/value-changes/value-changes.component').then(m => m.valueChangesComponent)
  },
  {
    path: 'status-changes',
    loadComponent: () => import('./features/components/status-changes/status-changes.component').then(m => m.StatusChangesComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./features/components/services/services.component').then(m => m.ServicesComponent)
  }
];
