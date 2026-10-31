export const bookingPageTheme = {
  page: 'relative isolate flex min-h-svh flex-col bg-lobby',
  container:
    'relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 pt-4 pb-12 sm:px-10 sm:pt-6',
  header:
    'mb-7 grid min-h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b border-ivory/10 pb-4 sm:mb-9',
  navigation: 'col-start-1 row-start-1 min-w-0 justify-self-start',
  brand:
    'col-start-2 row-start-1 inline-flex min-h-11 items-center justify-self-center text-ivory transition-colors hover:text-amber-light',
  link: 'inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-amber-light',
  intro:
    'mb-7 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-5 rounded-sm border border-ivory/10 bg-surface/60 p-5 sm:mb-9 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-7 sm:p-6',
  poster:
    'relative aspect-[2/3] w-full overflow-hidden rounded-sm bg-raised shadow-screen',
  details: 'min-w-0',
  eyebrow: 'mb-3 text-[10px] tracking-[0.2em] text-amber',
  title: 'font-display text-3xl leading-tight sm:text-4xl',
  genres: 'mt-2 text-xs text-muted',
  metadata:
    'mt-3 flex flex-col gap-1 text-xs text-muted sm:flex-row sm:flex-wrap sm:gap-x-5 sm:text-sm',
  layout: 'grid w-full grid-cols-1 gap-5 sm:gap-6',
  seatMap: 'min-w-0',
  summary: 'grid w-full gap-x-8 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto]',
  summaryHeader: 'flex flex-wrap items-center gap-x-5 gap-y-1 sm:col-start-1',
  summaryTitle: 'font-display text-2xl',
  selectionDetails: 'min-w-0 sm:col-start-1 sm:row-start-2',
  count: 'text-xs text-muted',
  selected: 'mt-3 flex flex-wrap gap-2',
  chip: 'min-w-12 rounded-sm border border-amber/30 bg-amber/10 px-3 py-2 text-sm font-medium text-amber-light',
  empty: 'mt-3 text-sm leading-relaxed text-muted',
  clear:
    'min-h-11 text-xs text-muted underline underline-offset-4 transition-colors hover:text-amber-light disabled:opacity-40',
  checkoutAction:
    'mt-3 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:self-center',
  checkoutButton:
    'inline-flex min-h-12 w-full items-center justify-center rounded-sm border border-amber bg-amber px-6 py-3 text-sm font-semibold text-lobby transition-colors hover:border-amber-light hover:bg-amber-light disabled:cursor-default disabled:border-ivory/15 disabled:bg-raised disabled:text-muted',
  status:
    'mb-5 rounded-sm border border-amber/25 bg-amber/5 p-4 text-sm text-amber-light',
  error: 'mb-5 text-sm text-muted',
};
