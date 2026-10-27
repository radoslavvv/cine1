export function ScreenProjection() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#152331]">
      <svg className="absolute inset-0 size-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="projection-sky" x2="0" y2="1">
            <stop stopColor="#1e1b3e" /><stop offset="1" stopColor="#749da4" />
          </linearGradient>
          <radialGradient id="projection-moon"><stop stopColor="#ebd9b7" /><stop offset="1" stopColor="#b6b8b0" /></radialGradient>
        </defs>
        <rect width="1000" height="600" fill="url(#projection-sky)" />
        <circle cx="720" cy="145" r="77" fill="url(#projection-moon)" opacity=".85" />
        <path d="M0 370 130 270 250 360 460 180 590 330 690 260 1000 420V600H0Z" fill="#253742" />
        <path d="m390 240 70-60 58 68-58-20Z" fill="#afbdba" opacity=".55" />
        <path d="M0 440 200 350 370 450 550 320 700 430 850 350 1000 470V600H0Z" fill="#16272f" />
        <path d="M0 490Q250 440 500 490T1000 490V600H0Z" fill="#101c29" />
        <path d="M0 515Q250 465 500 515T1000 515M80 545H410M620 556H940" fill="none" stroke="#b7b5a0" strokeWidth="1" opacity=".2" />
      </svg>
      <div className="absolute inset-0 bg-linear-to-t from-lobby/50 via-transparent to-lobby/10" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-label text-[clamp(6px,0.8vw,12px)] tracking-[0.5em] text-ivory/70">YOU’RE SOMEWHERE ELSE NOW</span>
        <p className="mt-[3%] font-display text-[clamp(24px,4vw,68px)] tracking-[0.12em] text-ivory drop-shadow-lg">frame.</p>
      </div>
    </div>
  );
}
