import { lazy } from 'react';

// Vite removes the import branch and the admin chunk from production builds.
export const AdminRoute = import.meta.env.DEV
  ? lazy(() =>
      import('./pages/AdminPage').then((module) => ({
        default: module.AdminPage,
      })),
    )
  : null;
