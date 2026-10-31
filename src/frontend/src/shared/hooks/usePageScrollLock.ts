import { useLayoutEffect } from 'react';

export function lockPageScroll(html: HTMLElement, target: Window) {
  const previousOverflow = html.style.overflow;
  const previousGutter = html.style.scrollbarGutter;

  html.style.scrollbarGutter = 'stable';
  html.style.overflow = 'hidden';

  const preventScroll = (event: Event) => {
    return event.preventDefault();
  };

  target.addEventListener('wheel', preventScroll, { passive: false });
  target.addEventListener('touchmove', preventScroll, { passive: false });

  return () => {
    html.style.overflow = previousOverflow;
    html.style.scrollbarGutter = previousGutter;
    target.removeEventListener('wheel', preventScroll);
    target.removeEventListener('touchmove', preventScroll);
  };
}

export function usePageScrollLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) {
      return;
    }

    return lockPageScroll(document.documentElement, window);
  }, [locked]);
}
