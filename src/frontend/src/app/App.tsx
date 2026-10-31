import { Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ShowtimesPage } from '../features/showtimes';
import {
  BookingPage,
  ConfirmationPage,
  MyBookingsPage,
} from '../features/booking';
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage';
import { useAppNavigation } from './hooks/useAppNavigation';
import { appTheme as theme } from './App.theme';
import { RouteTransition } from './components/RouteTransition/RouteTransition';
import { Suspense } from 'react';
import { AdminRoute } from '../features/admin/AdminRoute';
import { AccountPage, RequireAccount } from '../features/auth';

export function App() {
  const location = useLocation();
  const { pathname } = location;
  const { mainRef, completeEntrance, arrive } = useAppNavigation();

  return (
    <>
      <main ref={mainRef} tabIndex={-1} className={theme.main}>
        <RouteTransition key={pathname} pathname={pathname} onEnter={arrive}>
          <Routes location={location}>
            <Route
              path="/"
              element={<HomePage onComplete={completeEntrance} />}
            />

            <Route path="/showtimes" element={<ShowtimesPage />} />
            <Route
              path="/account/bookings"
              element={
                <RequireAccount>
                  <MyBookingsPage />
                </RequireAccount>
              }
            />
            <Route
              path="/account/:action"
              element={<AccountPage key={pathname} />}
            />
            {AdminRoute && (
              <Route
                path="/admin/*"
                element={
                  <Suspense
                    fallback={
                      <p className="p-8" role="status">
                        Loading administration…
                      </p>
                    }
                  >
                    <RequireAccount administrator>
                      <AdminRoute />
                    </RequireAccount>
                  </Suspense>
                }
              />
            )}

            <Route
              path="/booking/:showtimeId"
              element={<BookingPage key={pathname} />}
            />
            <Route
              path="/booking/confirmation/:token"
              element={<ConfirmationPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </RouteTransition>
      </main>
    </>
  );
}
