import { useLayoutEffect, useRef } from 'react';
import { scheduleMotionTheme } from '../pages/SchedulePage.theme';
import type { ScheduleMotionSession } from '../model/scheduleMotion';

export function useScheduleMotion(
  session: ScheduleMotionSession,
  preview: boolean,
  selectedDate: string,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previousDate = useRef(selectedDate);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Map<
      HTMLElement,
      { animation: Animation; key: string; delay: number; duration: number }
    >();

    function sync() {
      for (const { animation, key, delay, duration } of animations.values()) {
        const start = session.startFor(key, delay);
        if (reducedMotion.matches) {
          animation.cancel();
        } else if (start === null) {
          animation.pause();
          animation.currentTime = 0;
        } else if (performance.now() - start >= duration) {
          animation.cancel();
        } else {
          // The same scheduled timestamp is used after the route remount.
          animation.play();
          animation.startTime = start;
        }
      }
    }

    function register() {
      for (const [element, record] of animations) {
        if (!root!.contains(element)) {
          record.animation.cancel();
          animations.delete(element);
        }
      }
      root!
        .querySelectorAll<HTMLElement>('[data-schedule-enter]')
        .forEach((element) => {
          if (animations.has(element)) return;
          const kind = element.dataset
            .scheduleEnter as keyof typeof scheduleMotionTheme;
          const definition = scheduleMotionTheme[kind];
          if (!definition) return;
          const order = Number(element.dataset.scheduleOrder ?? 0);
          const animation = element.animate(definition.frames, {
            duration: definition.duration,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards',
          });
          animation.pause();
          animation.currentTime = 0;
          animations.set(element, {
            animation,
            key: element.dataset.scheduleKey ?? kind,
            delay: definition.delay + Math.min(order, 6) * definition.stagger,
            duration: definition.duration,
          });
        });
      sync();
    }

    if (!preview) session.start();
    register();
    const unsubscribe = session.subscribe(sync);
    const observer = new MutationObserver(register);
    observer.observe(root, { childList: true, subtree: true });
    reducedMotion.addEventListener('change', sync);

    return () => {
      observer.disconnect();
      unsubscribe();
      reducedMotion.removeEventListener('change', sync);
      animations.forEach(({ animation }) => animation.cancel());
    };
  }, [session, preview]);

  useLayoutEffect(() => {
    if (previousDate.current === selectedDate) return;
    previousDate.current = selectedDate;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations = Array.from(
      rootRef.current?.querySelectorAll('[data-showtimes]') ?? [],
    ).map((element) =>
      element.animate(
        [
          { opacity: 0.35, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 220, easing: 'ease-out' },
      ),
    );
    return () => animations.forEach((animation) => animation.cancel());
  }, [selectedDate]);

  return rootRef;
}
