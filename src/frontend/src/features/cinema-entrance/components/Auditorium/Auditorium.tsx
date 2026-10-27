import { auditoriumTheme as theme } from './Auditorium.theme';

export function Auditorium() {
  return (
    <div className={theme.room} aria-hidden="true">
      <div
        className={theme.camera}
        data-cinema-camera
        style={{
          transform:
            'translate3d(calc(var(--camera-shift-x, 0px) * var(--travel)), calc(var(--camera-shift-y, 0px) * var(--travel)), 0) scale(calc(1 + (var(--camera-scale, 1) - 1) * var(--travel)))',
        }}
      >
        <div className={theme.canvas}>
          <img
            className={theme.layer}
            src="/auditorium-room.jpg"
            alt=""
            fetchPriority="high"
            decoding="async"
            width={1672}
            height={941}
          />
          <div
            className={theme.screen}
            data-cinema-screen
            style={{
              opacity: 'min(1, max(0, calc(var(--travel) * 2.5 - 0.5)))',
            }}
          />
          <div
            className={theme.projection}
            style={{
              opacity:
                'min(1, max(0, calc((var(--travel) - 0.4) * 8)), max(0, calc((0.97 - var(--travel)) * 8)))',
            }}
          >
            <div className={theme.projectionCopy}>
              <span
                className={theme.firstLine}
                style={{
                  clipPath:
                    'inset(0 calc((1 - clamp(0, calc((var(--travel) - 0.42) * 4.55), 1)) * 100%) 0 0)',
                }}
              >
                Your next great film
              </span>
              <span
                className={theme.secondLine}
                style={{
                  clipPath:
                    'inset(0 calc((1 - clamp(0, calc((var(--travel) - 0.57) * 4.55), 1)) * 100%) 0 0)',
                }}
              >
                experience waits for you
              </span>
            </div>
          </div>
          <img
            className={theme.layer}
            data-parallax-layer="middle"
            src="/auditorium-middle.png"
            alt=""
            fetchPriority="high"
            decoding="async"
            width={1672}
            height={941}
            style={{
              transform:
                'translate3d(0, calc(var(--travel) * 10%), 0) scale(calc(1 + var(--travel) * 0.04))',
            }}
          />
          <img
            className={theme.layer}
            data-parallax-layer="foreground"
            src="/auditorium-foreground.png"
            alt=""
            fetchPriority="high"
            decoding="async"
            width={1672}
            height={941}
            style={{
              transform:
                'translate3d(0, calc(var(--travel) * 22%), 0) scale(calc(1 + var(--travel) * 0.1))',
            }}
          />
        </div>
      </div>
      <div
        className={theme.lights}
        style={{ opacity: 'calc(1 - var(--travel))' }}
      >
        <div className={theme.loadDimmer} />
      </div>
      <div
        className={theme.shade}
        style={{ opacity: 'calc(1 - var(--travel))' }}
      />
    </div>
  );
}
