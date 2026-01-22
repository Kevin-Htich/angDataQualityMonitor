import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
  },
  {
    path: 'incidents',
    loadChildren: () =>
      import('./features/incidents/incidents.routes').then((m) => m.INCIDENTS_ROUTES)
  },
  {
    path: 'rules',
    loadChildren: () =>
      import('./features/rules/rules.routes').then((m) => m.RULES_ROUTES)
  },
  {
    path: 'feeds',
    loadChildren: () =>
      import('./features/feeds/feeds.routes').then((m) => m.FEEDS_ROUTES)
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
