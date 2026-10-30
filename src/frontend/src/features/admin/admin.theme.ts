export const adminTheme = {
  page: 'min-h-screen bg-lobby px-5 py-8 text-sm text-ivory sm:px-10 sm:py-12',
  container: 'mx-auto max-w-7xl',
  header:
    'mb-10 flex flex-wrap items-start justify-between gap-6 border-b border-edge pb-8',
  eyebrow:
    'mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber',
  title: 'font-display text-5xl leading-none sm:text-6xl',
  subtitle: 'mt-3 max-w-xl text-sm leading-relaxed text-muted',
  link: 'text-amber underline-offset-4 hover:underline',
  tabs: 'mb-8 flex flex-wrap gap-2',
  tab: 'rounded-full border border-edge px-5 py-2.5 text-muted transition-colors hover:border-amber hover:text-ivory',
  activeTab:
    'rounded-full border border-amber bg-amber/10 px-5 py-2.5 text-amber',
  heading: 'font-display text-3xl',
  toolbar: 'mb-5 flex flex-wrap items-center justify-between gap-4',
  layout:
    'grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]',
  panel: 'min-w-0 rounded-2xl border border-edge bg-surface p-5 sm:p-6',
  cards: 'grid gap-3',
  card: 'flex flex-wrap items-center justify-between gap-4 rounded-xl border border-edge bg-surface p-4',
  cardTitle: 'text-base font-medium',
  muted: 'text-xs leading-relaxed text-muted',
  actions: 'flex flex-wrap items-center gap-2',
  form: 'mt-5 grid gap-4',
  field: 'grid min-w-0 gap-1.5 text-xs font-medium text-muted',
  row: 'grid gap-4 sm:grid-cols-2',
  badge:
    'inline-flex rounded-full border border-edge px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted',
  notice:
    'mb-5 rounded-xl border border-sage/30 bg-sage/5 p-4 text-sm text-sage',
  error:
    'mb-5 rounded-xl border border-rose/40 bg-rose/5 p-4 text-sm text-rose',
  checks: 'flex flex-wrap gap-4 text-sm text-ivory',
  preview: 'mt-3 overflow-x-auto rounded-xl border border-edge bg-lobby p-4',
  screen:
    'mx-auto mb-5 max-w-48 rounded-t-[50%] border-t-2 border-amber/60 pt-2 text-center text-[9px] uppercase tracking-[0.3em] text-muted',
  seats: 'mx-auto grid w-max gap-1',
  seat: 'flex h-5 w-6 items-center justify-center rounded-t-md border border-sage/40 bg-sage/10 text-[8px] text-sage',
  tableWrap: 'overflow-x-auto rounded-xl border border-edge',
  table:
    'w-full border-collapse text-left text-xs [&_th]:border-b [&_th]:border-edge [&_th]:bg-surface [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium [&_th]:text-muted [&_td]:border-b [&_td]:border-edge/60 [&_td]:px-4 [&_td]:py-4',
  filters: 'mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5',
};
