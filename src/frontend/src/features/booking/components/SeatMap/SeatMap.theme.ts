export const seatMapTheme = {
  panel:
    'min-w-0 rounded-sm border border-ivory/10 bg-surface/40 px-3 py-7 sm:px-7 sm:py-9',
  screen:
    'mx-auto mb-10 w-3/4 rounded-t-[50%] border-t-2 border-amber/60 bg-gradient-to-b from-amber/10 to-transparent pt-4 pb-3 text-center text-[10px] tracking-[0.3em] text-muted',
  hint: 'mb-4 text-center text-xs text-muted sm:hidden',
  scroll:
    'overflow-x-auto overscroll-x-contain pb-4 focus-visible:outline-2 focus-visible:outline-amber',
  grid: 'mx-auto grid w-max gap-y-1',
  row: 'grid items-center',
  rowLabel: 'text-center text-xs text-muted',
  seat: 'group flex h-11 w-11 items-center justify-center disabled:cursor-default',
  chair:
    'flex h-8 w-8 items-center justify-center rounded-t-lg rounded-b-sm border border-b-4 text-[10px] font-medium transition-colors',
  available:
    'border-ivory/40 bg-raised text-ivory group-hover:border-amber/70 group-hover:bg-amber/10 group-disabled:border-ivory/20 group-disabled:text-muted',
  selected: 'border-amber bg-amber text-lobby',
  taken: 'border-rose/50 bg-rose/20 text-xl leading-none text-rose',
  takenSwatch: 'border-rose/50 bg-rose/20 text-base leading-none text-rose',
  legend:
    'mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted',
  legendItem: 'inline-flex items-center gap-2',
  swatch:
    'inline-flex h-5 w-5 items-center justify-center rounded-t-md rounded-b-sm border border-b-2',
};
