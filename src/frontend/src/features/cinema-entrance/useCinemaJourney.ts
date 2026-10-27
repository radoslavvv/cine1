import { useEffect, useRef } from 'react';

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function useCinemaJourney() {
  const rootRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const journey = journeyRef.current;
    const stage = stageRef.current;
    const schedule = scheduleRef.current;
    if (!root || !journey || !stage || !schedule) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let disposed = false;

    function update() {
      frame = 0;
      if (!root || !journey || !stage || !schedule || disposed) return;
      const distance = journey.offsetHeight - stage.offsetHeight;
      const progress = reducedMotion.matches ? 0 : clamp(-journey.getBoundingClientRect().top / Math.max(1, distance));
      // Smooth camera travel without smoothing or intercepting native scrolling.
      const travel = progress * progress * (3 - 2 * progress);
      const revealed = reducedMotion.matches || progress >= 0.98;
      root.style.setProperty('--travel', String(travel));
      root.style.setProperty('--schedule-opacity', String(reducedMotion.matches ? 1 : clamp((progress - 0.96) / 0.04)));
      root.style.setProperty('--entrance-hint', String(clamp(1 - progress * 5)));
      schedule.inert = !revealed;
      if (revealed) schedule.removeAttribute('aria-hidden');
      else schedule.setAttribute('aria-hidden', 'true');
    }

    function requestUpdate() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    const observer = new ResizeObserver(requestUpdate);
    observer.observe(journey);
    observer.observe(stage);
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('resize', requestUpdate);
    addEventListener('pageshow', requestUpdate);
    reducedMotion.addEventListener('change', requestUpdate);
    update();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener('scroll', requestUpdate);
      removeEventListener('resize', requestUpdate);
      removeEventListener('pageshow', requestUpdate);
      reducedMotion.removeEventListener('change', requestUpdate);
    };
  }, []);

  function skipToSchedule() {
    const schedule = scheduleRef.current;
    if (!schedule) return;
    schedule.inert = false;
    schedule.removeAttribute('aria-hidden');
    schedule.scrollIntoView({ behavior: 'instant', block: 'start' });
    schedule.focus({ preventScroll: true });
    history.replaceState(null, '', '#schedule');
  }

  return { rootRef, journeyRef, stageRef, scheduleRef, skipToSchedule };
}
