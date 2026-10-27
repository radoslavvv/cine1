import { CinemaEntrance } from '../features/cinema-entrance';
import { SchedulePage } from '../features/schedule';

export function App() {
  return (
    <main>
      <CinemaEntrance>
        <SchedulePage />
      </CinemaEntrance>
    </main>
  );
}
