import { Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SchedulePage } from '../features/schedule';
import { BookingPage, ConfirmationPage } from '../features/booking';
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage';
import { useAppNavigation } from './hooks/useAppNavigation';
import { appTheme as theme } from './App.theme';
import { AnimatePresence } from 'motion/react';
import { RouteTransition } from './components/RouteTransition/RouteTransition';
import { Suspense } from 'react';
import { AdminRoute } from '../features/admin/AdminRoute';

export function App() {
  const location = useLocation();
  const { pathname } = location;
  const { mainRef, completeEntrance, arrive } = useAppNavigation();

  return (
    <main ref={mainRef} tabIndex={-1} className={theme.main}>
      <AnimatePresence mode="wait">
        <RouteTransition key={pathname} pathname={pathname} onEnter={arrive}>
          <Routes location={location}>
            <Route
              path="/"
              element={<HomePage onComplete={completeEntrance} />}
            />

            <Route path="/schedule" element={<SchedulePage />} />
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
                    <AdminRoute />
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
      </AnimatePresence>
    </main>
  );
}
