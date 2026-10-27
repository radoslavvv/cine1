export const schedulePageTheme = {
  page: 'flex min-h-svh flex-col bg-lobby',
  container:
    'mx-auto w-full max-w-6xl flex-1 px-5 pt-4 pb-10 sm:px-10 sm:pt-6 sm:pb-14',
  header:
    'grid min-h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b border-ivory/10 pb-4',
  brand:
    'col-start-2 inline-flex min-h-11 items-center justify-self-center text-ivory transition-colors hover:text-amber-light',
  results: 'mt-7 min-h-[32rem]',
  catalogStatus: 'mb-5 text-sm leading-relaxed text-muted',
  movieList: 'divide-y divide-ivory/10 border-t border-ivory/10',
  movieRow:
    'grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 gap-y-5 py-7 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-x-7 sm:gap-y-6',
  poster: 'relative aspect-[2/3] overflow-hidden rounded-sm bg-surface',
  category: 'mb-2 font-label text-[11px] tracking-[0.16em] text-amber/80',
  movieTitle:
    'font-display text-3xl font-medium leading-tight text-ivory sm:text-4xl',
  metadata: 'mt-2 text-sm text-muted',
  synopsis: 'mt-3 hidden max-w-lg text-sm leading-relaxed text-muted sm:block',
  showtimes: 'col-span-full',
  times: 'flex flex-wrap gap-2',
  time: 'flex size-26 shrink-0 flex-col rounded-sm border px-2 py-2 font-label text-base leading-6 tabular-nums',
  timeUpcoming: 'border-sage/30 bg-sage/[0.07] text-sage',
  timeLink: 'transition-colors hover:border-sage/70 hover:bg-sage/15',
  timeStarted: 'border-amber/35 bg-amber/[0.08] text-amber-light',
  timeFinished: 'border-ivory/8 bg-ivory/[0.02] text-muted',
  timeAuditorium: 'mt-0.5 block truncate text-[10px] leading-4 text-muted',
  timeFormat: 'block text-[10px] leading-4 text-current',
  timeStatus: 'mt-auto block h-3 text-[10px] leading-3 text-current',
  skeleton: 'rounded-sm bg-ivory/[0.06] motion-safe:animate-pulse',
  emptyState: 'border-t border-ivory/10 py-16 text-center',
  emptyTitle: 'font-display text-3xl text-ivory',
  emptyHint: 'mt-2 text-sm text-muted',
  footer:
    'relative w-full shrink-0 border-t border-amber/15 bg-carpet before:pointer-events-none before:absolute before:inset-0 before:bg-lobby/40',
  footerDetails:
    'relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-5 px-5 text-ivory sm:h-20 sm:px-10',
  footerBrand: 'font-display text-2xl font-semibold tracking-[-0.055em]',
  footerLink:
    'inline-flex min-h-11 items-center gap-4 text-xs text-ivory/80 transition-colors hover:text-amber-light',
};

// Keep motion with component presentation. Only opacity and transforms animate.
const fade: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
const rise: Keyframe[] = [
  { opacity: 0, transform: 'translateY(12px)' },
  { opacity: 1, transform: 'translateY(0)' },
];
export const scheduleMotionTheme = {
  header: { frames: fade, duration: 340, delay: 0, stagger: 0 },
  date: { frames: rise, duration: 350, delay: 140, stagger: 35 },
  row: { frames: rise, duration: 420, delay: 320, stagger: 65 },
  poster: {
    frames: [
      { opacity: 0, transform: 'scale(0.96)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    duration: 520,
    delay: 350,
    stagger: 65,
  },
  details: {
    frames: [
      { opacity: 0, transform: 'translateX(6px)' },
      { opacity: 1, transform: 'translateX(0)' },
    ],
    duration: 400,
    delay: 370,
    stagger: 65,
  },
  times: { frames: fade, duration: 360, delay: 400, stagger: 65 },
  footer: { frames: fade, duration: 450, delay: 560, stagger: 0 },
};
