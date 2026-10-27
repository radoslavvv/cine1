export const cinemaEntranceTheme = {
  header: 'absolute inset-x-5 top-4 z-40 flex items-center justify-between border-b border-ivory/15 pb-4 sm:inset-x-10 sm:top-7',
  skip: 'inline-flex min-h-11 items-center gap-5 text-sm text-ivory transition-colors hover:text-amber-light motion-safe:animate-entrance-rise motion-safe:[animation-delay:80ms]',
  journey: 'relative h-[300svh] motion-reduce:h-svh',
  stage: 'sticky top-0 h-svh overflow-hidden',
  scene: 'absolute inset-0 motion-safe:animate-entrance-scene',
  brand: 'text-ivory drop-shadow-md motion-safe:animate-entrance-rise',
  hint: 'absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3 px-4 py-2 text-ivory/80 transition-colors hover:text-amber-light',
  hintLabel: 'text-[10px] uppercase tracking-[0.28em]',
  hintContent: 'flex flex-col items-center gap-3 motion-safe:animate-entrance-rise motion-safe:[animation-delay:160ms]',
  schedule: 'relative z-40 -mt-[100svh] min-h-svh bg-lobby motion-reduce:mt-0',
};
