import { useLocation } from 'react-router-dom';
import {
  CinemaEntrance,
  useCinemaJourney,
} from '../../features/cinema-entrance';

export function HomePage({ onComplete }: { onComplete: () => void }) {
  const { search } = useLocation();
  const journey = useCinemaJourney(onComplete);

  return <CinemaEntrance {...journey} showtimesHref={`/showtimes${search}`} />;
}
