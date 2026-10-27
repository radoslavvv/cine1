const rows = [
  { top: 57, scale: 0.48, speed: 95 },
  { top: 64, scale: 0.64, speed: 140 },
  { top: 73, scale: 0.85, speed: 190 },
  { top: 84, scale: 1.08, speed: 245 },
  { top: 100, scale: 1.38, speed: 300 },
];

function SeatBank() {
  return (
    <div className="flex w-[43%] items-end gap-[1.8%]">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={`relative h-full flex-1 rounded-t-[20%] border-x border-t border-[#78534b]/40 bg-linear-to-b from-[#38282a] via-[#21171e] to-[#100e15] shadow-[-5px_0_12px_#0008,inset_0_3px_4px_#9a6c4930] ${index >= 4 ? 'hidden sm:block' : ''}`}>
          <div className="absolute inset-x-[8%] top-[7%] h-[60%] rounded-t-[20%] border-t border-white/5 bg-linear-to-b from-[#33262c] to-[#1d151e]" />
          <div className="absolute -right-[7%] bottom-[15%] h-[35%] w-[13%] rounded-t-md border-t border-amber/15 bg-[#1b131a]" />
          <div className="absolute -left-[7%] bottom-[15%] h-[35%] w-[13%] rounded-t-md border-t border-amber/15 bg-[#1b131a]" />
          <div className="absolute inset-x-0 bottom-0 h-[18%] rounded-t-[30%] border-t border-black/40 bg-[#0e0b12]" />
        </div>
      ))}
    </div>
  );
}

export function SeatRows() {
  return rows.map((row, index) => (
    <div
      key={row.top}
      data-seat-row={index}
      className="absolute left-1/2 z-20 flex h-[clamp(70px,12vw,160px)] w-[125%] justify-between will-change-transform"
      style={{
        top: `${row.top}%`,
        transform: `translateX(-50%) translateY(calc(var(--travel) * ${row.speed}vh)) scale(calc(${row.scale} + var(--travel) * ${row.scale * 2}))`,
        opacity: `max(0, calc(1 - var(--travel) * ${1.7 + index * 0.2}))`,
      }}
    >
      <SeatBank />
      <SeatBank />
    </div>
  ));
}
