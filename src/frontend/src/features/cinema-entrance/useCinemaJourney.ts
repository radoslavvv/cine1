import { useLayoutEffect, useRef } from 'react';
import { getJourneyGeometry, getScheduleScrollOffset } from './journeyGeometry';

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function useCinemaJourney(onComplete: (scrollOffset: number) => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const journey = journeyRef.current;
    const stage = stageRef.current;
    const schedule = scheduleRef.current;
    if (!root || !journey || !stage || !schedule) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let previousTime = 0;
    let progress = 0;
    let target = 0;
    let completed = false;

    function update(time: number) {
      frame = 0;
      if (!root || !schedule || completed) return;
      const delta = previousTime ? Math.min(time - previousTime, 64) : 16;
      previousTime = time;
      // Time-based damping softens wheel steps without changing native scrolling.
      progress += (target - progress) * (1 - Math.exp(-delta / 65));
      if (Math.abs(target - progress) < 0.0005) progress = target;
      // Arrive at the screen before revealing any of the schedule.
      const camera = clamp(progress / 0.84);
      const travel = camera * camera * (3 - 2 * camera);
      const reveal = clamp((progress - 0.88) / 0.12);
      root.style.setProperty('--travel', String(travel));
      root.style.setProperty('--schedule-opacity', String(reducedMotion.matches ? 1 : reveal * reveal * (3 - 2 * reveal)));
      root.style.setProperty('--entrance-hint', String(clamp(1 - progress * 5)));

      if (target === 1 && progress === 1) {
        completed = true;
        onComplete(getScheduleScrollOffset(schedule.getBoundingClientRect().top));
      } else if (progress !== target) {
        frame = requestAnimationFrame(update);
      } else {
        previousTime = 0;
      }
    }

    function measure() {
      if (!journey || !stage || !root || !schedule || completed) return;
      const distance = journey.offsetHeight - stage.offsetHeight;
      const top = journey.getBoundingClientRect().top;
      target = reducedMotion.matches ? 0 : clamp(-top / Math.max(1, distance));
      if (reducedMotion.matches) {
        progress = 0;
        root.style.setProperty('--travel', '0');
        root.style.setProperty('--entrance-hint', '1');
        root.style.setProperty('--schedule-opacity', '1');
        schedule.inert = false;
        schedule.removeAttribute('aria-hidden');
        if (-top >= journey.offsetHeight - 1) {
          completed = true;
          onComplete(getScheduleScrollOffset(schedule.getBoundingClientRect().top));
        }
      } else {
        schedule.inert = true;
        schedule.setAttribute('aria-hidden', 'true');
      }
      if (!frame && !completed) frame = requestAnimationFrame(update);
    }

    function resize() {
      if (!root || !stage) return;
      const geometry = getJourneyGeometry(stage.clientWidth, stage.clientHeight);
      root.style.setProperty('--image-width', `${geometry.imageWidth}px`);
      root.style.setProperty('--image-height', `${geometry.imageHeight}px`);
      root.style.setProperty('--image-left', `${geometry.left}px`);
      root.style.setProperty('--image-top', `${geometry.top}px`);
      root.style.setProperty('--camera-origin-x', `${geometry.originX}px`);
      root.style.setProperty('--camera-origin-y', `${geometry.originY}px`);
      root.style.setProperty('--camera-scale', String(geometry.scale));
      root.style.setProperty('--camera-shift-x', `${geometry.shiftX}px`);
      root.style.setProperty('--camera-shift-y', `${geometry.shiftY}px`);
      measure();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(journey);
    observer.observe(stage);
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', resize);
    addEventListener('pageshow', resize);
    reducedMotion.addEventListener('change', measure);
    resize();

    return () => {
      completed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener('scroll', measure);
      removeEventListener('resize', resize);
      removeEventListener('pageshow', resize);
      reducedMotion.removeEventListener('change', measure);
    };
  }, [onComplete]);

  return { rootRef, journeyRef, stageRef, scheduleRef };
}
