export const auditoriumTheme = {
  room: 'absolute inset-0 overflow-hidden bg-lobby',
  camera:
    'absolute inset-0 origin-[var(--camera-origin-x,50%)_var(--camera-origin-y,40%)] will-change-transform',
  canvas:
    'absolute top-[var(--image-top,0px)] left-[var(--image-left,0px)] h-[var(--image-height,100%)] w-[var(--image-width,100%)]',
  layer: 'absolute inset-0 size-full origin-[50%_40%] will-change-transform',
  screen:
    'absolute top-[23.9107%] left-[34.0909%] h-[27.6302%] w-[31.8182%] bg-[radial-gradient(ellipse_at_50%_45%,#19171f_0%,#0e0c13_85%)]',
  projection:
    'absolute top-[23.9107%] left-[34.0909%] flex h-[27.6302%] w-[31.8182%] items-center justify-center overflow-hidden [container-type:inline-size] motion-reduce:opacity-100!',
  projectionCopy:
    'flex w-full flex-col items-center gap-[1cqw] px-[8%] text-center font-display text-[10cqw] leading-[1.05] font-medium tracking-[-0.025em] text-ivory/50',
  firstLine: 'block whitespace-nowrap motion-reduce:[clip-path:none]!',
  secondLine:
    'block whitespace-nowrap italic text-ivory/40 motion-reduce:[clip-path:none]!',
  lights: 'pointer-events-none absolute inset-0',
  loadDimmer:
    'absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,#08070c12_5%,#08070c66_55%,#08070cb3_100%)] motion-safe:animate-entrance-dim',
  shade:
    'absolute inset-0 bg-[linear-gradient(180deg,#08070c80_0%,transparent_25%,transparent_65%,#08070cb3_100%)]',
};
