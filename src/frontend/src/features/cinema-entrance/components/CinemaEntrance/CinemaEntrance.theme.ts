export const cinemaEntranceTheme = {
  header:
    'absolute inset-x-6 top-7 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:inset-x-14 sm:top-12',
  rightNav: 'justify-self-end',
  skip: 'inline-flex min-h-11 items-center gap-2 text-[11px] text-ivory/85 transition-colors hover:text-amber-light sm:gap-4 sm:text-sm motion-safe:animate-entrance-rise motion-safe:[animation-delay:320ms]',
  journey: 'relative h-[300svh] motion-reduce:h-[110svh]',
  stage: 'sticky top-0 h-svh overflow-hidden',
  scene: 'absolute inset-0',
  brand:
    'col-start-2 flex min-h-11 flex-col items-center gap-2 text-ivory drop-shadow-md transition-colors hover:text-amber-light sm:flex-row sm:gap-3 motion-safe:animate-entrance-rise motion-safe:[animation-delay:120ms]',
  emblem: 'size-7 text-amber sm:size-9',
  frame:
    'pointer-events-none absolute inset-3 z-30 border border-ivory/15 sm:inset-6',
  cornerTopLeft:
    'absolute -left-px -top-px size-4 border-l border-t border-amber/60',
  cornerTopRight:
    'absolute -right-px -top-px size-4 border-r border-t border-amber/60',
  cornerBottomLeft:
    'absolute -bottom-px -left-px size-4 border-b border-l border-amber/60',
  cornerBottomRight:
    'absolute -bottom-px -right-px size-4 border-b border-r border-amber/60',
  hint: 'pointer-events-none absolute bottom-9 left-1/2 z-40 flex -translate-x-1/2 select-none flex-col items-center gap-3 whitespace-nowrap px-4 py-2 text-ivory/80 sm:bottom-12',
  hintLabel: 'text-[10px] uppercase tracking-[0.28em]',
  hintContent:
    'flex flex-col items-center gap-3 motion-safe:animate-entrance-rise motion-safe:[animation-delay:480ms]',
};
