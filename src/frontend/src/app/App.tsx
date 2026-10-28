import { Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SchedulePage } from '../features/schedule';
import { BookingPage, ConfirmationPage } from '../features/booking';
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage';
import { useAppNavigation } from './hooks/useAppNavigation';
import { appTheme as theme } from './App.theme';

export function App() {
  const { pathname } = useLocation();
  const {
    mainRef,
    scheduleMotion,
    beginArrival,
    releaseArrival,
    completeEntrance,
  } = useAppNavigation();

  return (
    <main ref={mainRef} tabIndex={-1} className={theme.main}>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              motion={scheduleMotion}
              onComplete={completeEntrance}
              onScheduleArrival={beginArrival}
            />
          }
        />

        <Route
          path="/schedule"
          element={
            <SchedulePage motion={scheduleMotion} onReady={releaseArrival} />
          }
        />

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
    </main>
  );
}
