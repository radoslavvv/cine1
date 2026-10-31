import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { MoviesPanel } from '../../movies/admin/pages/MoviesPanel';
import { AuditoriumsPanel } from '../../auditoriums/admin/pages/AuditoriumsPanel';
import { ShowtimesPanel } from '../../showtimes/admin/pages/ShowtimesPanel';
import { BookingsPanel } from '../../booking/admin/pages/BookingsPanel';
import { adminTheme as t } from '../admin.theme';
import { AccountHeader } from '../../auth/components/AccountHeader/AccountHeader';

export function AdminPage() {
  return (
    <div className={t.page}>
      <div className={t.container}>
        <AccountHeader />
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
            <Link className={t.link} to="/showtimes">
              View public showtimes ↗
            </Link>
            <span className={t.badge}>Administrator</span>
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
        <Routes>
          <Route index element={<Navigate to="movies" replace />} />
          <Route path="movies" element={<MoviesPanel />} />
          <Route path="showtimes" element={<ShowtimesPanel />} />
          <Route path="auditoriums" element={<AuditoriumsPanel />} />
          <Route path="bookings" element={<BookingsPanel />} />
          <Route path="*" element={<Navigate to="/admin/movies" replace />} />
        </Routes>
      </div>
    </div>
  );
}
