import { useLocation } from 'react-router-dom';
import {
  CinemaEntrance,
  useCinemaJourney,
} from '../../features/cinema-entrance';
import { SchedulePage } from '../../features/schedule';
import type { ScheduleMotionSession } from '../../features/schedule/model/scheduleMotion';

export function HomePage({
  motion,
  onComplete,
  onScheduleArrival,
}: {
  motion: ScheduleMotionSession;
  onComplete: (scrollOffset: number) => void;
  onScheduleArrival: () => void;
}) {
  const { search } = useLocation();
  const journey = useCinemaJourney(onComplete, motion.start, onScheduleArrival);
  return (
    <CinemaEntrance {...journey} scheduleHref={`/schedule${search}`}>
      <SchedulePage motion={motion} preview />
    </CinemaEntrance>
  );
}
