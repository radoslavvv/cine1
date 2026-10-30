import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { adminQueries } from '../api/adminQueries';
import { MoviesPanel } from './MoviesPanel';
import { AuditoriumsPanel } from './AuditoriumsPanel';
import { ShowtimesPanel } from './ShowtimesPanel';
import { BookingsPanel } from './BookingsPanel';
import { AdminNotice } from '../components/AdminNotice';
import { adminTheme as t } from '../admin.theme';

export function AdminPage() {
  const catalog = useQuery(adminQueries.catalog());
  return (
    <div className={t.page}>
      <div className={t.container}>
        <header className={t.header}>
          <div>
            <p className={t.eyebrow}>cinemaR / administration</p>
            <h1 className={t.title}>Behind the screen.</h1>
            <p className={t.subtitle}>
              Manage the films, rooms, and screenings that bring your cinema to
              life.
            </p>
          </div>
          <div className="grid justify-items-end gap-3">
            <Link className={t.link} to="/schedule">
              View public schedule ↗
            </Link>
            <span className={t.badge}>Local development</span>
          </div>
        </header>
        <nav className={t.tabs} aria-label="Admin sections">
          {[
            ['movies', 'Movies'],
            ['showtimes', 'Showtimes'],
            ['auditoriums', 'Auditoriums'],
            ['bookings', 'Bookings'],
          ].map(([path, label]) => (
            <NavLink
              key={path}
              to={`/admin/${path}`}
              className={({ isActive }) => (isActive ? t.activeTab : t.tab)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <AdminNotice
          error={catalog.error?.message}
          retry={() => void catalog.refetch()}
        />
        {catalog.isPending && (
          <p className={t.muted} role="status">
            Loading your cinema…
          </p>
        )}
        {catalog.data && (
          <Routes>
            <Route index element={<Navigate to="movies" replace />} />
            <Route
              path="movies"
              element={<MoviesPanel catalog={catalog.data} />}
            />
            <Route
              path="showtimes"
              element={<ShowtimesPanel catalog={catalog.data} />}
            />
            <Route
              path="auditoriums"
              element={<AuditoriumsPanel catalog={catalog.data} />}
            />
            <Route
              path="bookings"
              element={<BookingsPanel catalog={catalog.data} />}
            />
            <Route path="*" element={<Navigate to="/admin/movies" replace />} />
          </Routes>
        )}
      </div>
    </div>
  );
}
