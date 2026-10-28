import { useEffect, useRef } from 'react';

export function useProjectorAtmosphere() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const motion = window.matchMedia(
      '(min-width: 1280px) and (prefers-reduced-motion: no-preference)',
    );
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = motion.matches
        ? Math.max(0, -root.getBoundingClientRect().top) * 0.045
        : 0;
      root.style.setProperty('--dust-scroll', `${offset}px`);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const sync = () => {
      window.removeEventListener('scroll', scheduleUpdate);
      if (motion.matches)
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
      scheduleUpdate();
    };
    sync();
    motion.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      motion.removeEventListener('change', sync);
    };
  }, []);

  return ref;
}
