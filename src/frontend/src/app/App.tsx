import { Route, Routes } from 'react-router-dom';
import { CinemaEntrance } from '../features/cinema-entrance';
import { SchedulePage } from '../features/schedule';
import { NotFoundPage } from './components/NotFoundPage/NotFoundPage';
import { useAppNavigation } from './hooks/useAppNavigation';
import { appTheme as theme } from './App.theme';

export function App() {
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
            <CinemaEntrance
              onComplete={completeEntrance}
              onScheduleReveal={scheduleMotion.start}
              onScheduleArrival={beginArrival}
            >
              <SchedulePage preview motion={scheduleMotion} />
            </CinemaEntrance>
          }
        />

        <Route
          path="/schedule"
          element={
            <SchedulePage motion={scheduleMotion} onReady={releaseArrival} />
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  );
}
