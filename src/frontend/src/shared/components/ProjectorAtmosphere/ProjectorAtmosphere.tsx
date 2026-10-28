import type { CSSProperties } from 'react';
import { useProjectorAtmosphere } from '../../hooks/useProjectorAtmosphere';
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
  const ref = useProjectorAtmosphere();

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
