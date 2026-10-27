import { useLayoutEffect, type RefObject } from 'react';

export function useScheduleReady(rootRef: RefObject<HTMLDivElement | null>, waitingForData: boolean, onReady?: () => void) {
  useLayoutEffect(() => {
    if (waitingForData || !onReady || !rootRef.current) return;
    let active = true;
    // Let the motion observer register newly loaded rows before collecting effects.
    const frame = requestAnimationFrame(() => {
      // Only entrance effects count: skeleton pulses are deliberately excluded.
      const animations = Array.from(rootRef.current?.querySelectorAll('[data-schedule-enter]') ?? [])
        .flatMap(element => element.getAnimations());
      void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        if (active) onReady();
      });
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [rootRef, waitingForData, onReady]);
}
