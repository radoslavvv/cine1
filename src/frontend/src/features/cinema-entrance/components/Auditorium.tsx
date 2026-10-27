import { auditoriumTheme as theme } from './Auditorium.theme';

export function Auditorium() {
  return (
    <div className={theme.room} aria-hidden="true">
      <div className={theme.camera} data-cinema-camera style={{
        transform: 'translate3d(calc(var(--camera-shift-x, 0px) * var(--travel)), calc(var(--camera-shift-y, 0px) * var(--travel)), 0) scale(calc(1 + (var(--camera-scale, 1) - 1) * var(--travel)))',
      }}>
        <div className={theme.canvas}>
          <img className={theme.layer} src="/auditorium-room.jpg" alt="" fetchPriority="high" decoding="async" width={1672} height={941} />
          <img className={theme.layer} data-parallax-layer="middle" src="/auditorium-middle.png" alt="" fetchPriority="high" decoding="async" width={1672} height={941} style={{
            transform: 'translate3d(0, calc(var(--travel) * 10%), 0) scale(calc(1 + var(--travel) * 0.04))',
          }} />
          <img className={theme.layer} data-parallax-layer="foreground" src="/auditorium-foreground.png" alt="" fetchPriority="high" decoding="async" width={1672} height={941} style={{
            transform: 'translate3d(0, calc(var(--travel) * 22%), 0) scale(calc(1 + var(--travel) * 0.1))',
          }} />
        </div>
      </div>
      <div className={theme.shade} style={{ opacity: 'calc(1 - var(--travel))' }} />
    </div>
  );
}
