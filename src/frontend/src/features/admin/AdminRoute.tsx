import { lazy } from 'react';

export const AdminRoute = lazy(() =>
  import('./pages/AdminPage').then((module) => ({
    default: module.AdminPage,
  })),
);
