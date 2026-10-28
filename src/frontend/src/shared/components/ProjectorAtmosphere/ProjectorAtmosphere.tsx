import { type CSSProperties, useEffect, useRef } from 'react';
import { projectorAtmosphereTheme as theme } from './ProjectorAtmosphere.theme';

// Stable positions keep the atmosphere consistent across renders and routes.
const dust = Array.from({ length: 24 }, (_, index) => ({
  left: 8 + ((index * 37) % 84),
  top: 5 + ((index * 23) % 88),
  size: index % 7 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
  speed: 0.35 + (index % 5) * 0.2,
  opacity: 0.16 + (index % 4) * 0.09,
}));

export function ProjectorAtmosphere() {
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

  return (
    <div ref={ref} className={theme.root} aria-hidden="true">
      {['left', 'right'].map((side) => (
        <div
          key={side}
          className={`${theme.gutter} ${side === 'right' ? theme.rightGutter : ''}`}
        >
          <div
            className={`${theme.beam} ${side === 'right' ? theme.rightBeam : ''}`}
          />
          {dust.map((particle, index) => (
            <span
              key={index}
              className={`${theme.dust} ${side === 'right' ? theme.rightDust : theme.leftDust}`}
              style={
                {
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  width: particle.size,
                  height: particle.size,
                  opacity: particle.opacity,
                  '--dust-speed': particle.speed,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
