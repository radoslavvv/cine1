export const projectorAtmosphereTheme = {
  root: 'pointer-events-none absolute inset-0 hidden justify-between [--dust-scroll:0px] xl:flex',
  gutter:
    'sticky top-0 h-svh w-[calc((100%_-_72rem)/2)] self-start overflow-hidden [mask-image:linear-gradient(transparent,#000_12%,#000_80%,transparent)]',
  rightGutter: '-scale-x-100',
  beam: 'absolute inset-0 bg-[radial-gradient(ellipse_at_0%_13%,#f6d8a718,transparent_65%),conic-gradient(from_145deg_at_5%_8%,transparent_0deg,#f5eee10a_12deg,#a38bd412_23deg,transparent_38deg)] blur-[12px]',
  rightBeam: 'opacity-70',
  dust: 'absolute rounded-full shadow-[0_0_5px_#f6d8a740] [transform:translate3d(calc(var(--dust-scroll)*var(--dust-speed)*0.18),calc(var(--dust-scroll)*var(--dust-speed)*-1),0)] motion-reduce:transform-none',
  leftDust: 'bg-amber-light',
  rightDust: 'bg-[#c5b1e7]',
};
