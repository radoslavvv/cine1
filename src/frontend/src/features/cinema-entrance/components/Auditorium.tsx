import { SeatRows } from './SeatRows';
import { ScreenProjection } from './ScreenProjection';

export function Auditorium() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#08070c] [--screen-left:8%] [--screen-top:30%] [--screen-width:84%] [--screen-height:24%] sm:[--screen-left:24%] sm:[--screen-top:27%] sm:[--screen-width:52%] sm:[--screen-height:36%]" aria-hidden="true">
      <div className="absolute inset-x-0 top-[48%] h-full bg-carpet" style={{ transform: 'translateY(calc(var(--travel) * 100vh)) scale(calc(1 + var(--travel)))', opacity: 'calc(1 - var(--travel))' }} />

      <div className="absolute inset-x-0 top-0 h-[34%] origin-bottom bg-[#10101a]" style={{ transform: 'translateY(calc(var(--travel) * -90vh)) scale(calc(1 + var(--travel)))' }}>
        <div className="ceiling-panels absolute inset-0 opacity-80" />
        {[12, 37, 62, 87].map((left) => <div key={left} className="absolute top-[35%] h-1.5 w-2 rounded-full bg-amber-light shadow-[0_0_20px_6px_#e9b67530] sm:w-3" style={{ left: `${left}%` }} />)}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-[#08070c] to-transparent" />
      </div>

      <div className="auditorium-curtain absolute inset-y-0 left-0 w-[25%] origin-right" style={{ clipPath: 'polygon(0 0, 100% 30%, 100% 67%, 0 100%)', transform: 'translateX(calc(var(--travel) * -70vw)) scale(calc(1 + var(--travel)))' }} />
      <div className="auditorium-curtain absolute inset-y-0 right-0 w-[25%] origin-left" style={{ clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 67%)', transform: 'translateX(calc(var(--travel) * 70vw)) scale(calc(1 + var(--travel)))' }} />
      <div className="absolute top-[28%] left-[4%] h-[38%] w-px bg-amber/40 shadow-[0_0_35px_15px_#e9b67512]" style={{ transform: 'translateX(calc(var(--travel) * -70vw))' }} />
      <div className="absolute top-[28%] right-[4%] h-[38%] w-px bg-amber/40 shadow-[0_0_35px_15px_#e9b67512]" style={{ transform: 'translateX(calc(var(--travel) * 70vw))' }} />

      <div
        data-cinema-screen
        className="absolute z-10 overflow-hidden border-[#27222a] bg-lobby shadow-[0_0_70px_#a4a3c41c]"
        style={{
          left: 'calc(var(--screen-left) * (1 - var(--travel)))',
          top: 'calc(var(--screen-top) * (1 - var(--travel)))',
          width: 'calc(var(--screen-width) + (100% - var(--screen-width)) * var(--travel))',
          height: 'calc(var(--screen-height) + (100% - var(--screen-height)) * var(--travel))',
          borderWidth: 'calc(8px * (1 - var(--travel)))',
        }}
      >
        <div className="absolute inset-0" style={{ opacity: 'max(0, calc(1 - var(--travel) * 1.2))' }}><ScreenProjection /></div>
      </div>

      <div className="absolute inset-x-[45%] top-[63%] h-[50%] bg-linear-to-b from-transparent to-amber/5" style={{ clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)', opacity: 'calc(1 - var(--travel))' }} />
      <SeatRows />
      <div className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(ellipse_at_50%_40%,transparent_30%,#0007_100%)]" style={{ opacity: 'calc(1 - var(--travel))' }} />
    </div>
  );
}
